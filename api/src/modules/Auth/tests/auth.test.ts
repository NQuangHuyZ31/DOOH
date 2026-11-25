import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Router } from '../../Core/router/router.js';
import { createApp } from '../../Core/app.js';
import { sendSuccess } from '../../Core/utils/httpUtil.js';
import { RedisKeyHelper } from '../../../../database/index.js';
import { AuthService } from '../services/authService.js';
import { buildDefaultAuthRules, createAuthGuard, requireHmacSignature } from '../middlewares/authGuard.js';
import { resolveMasterSecret, sha256Hex, verifyScopedKey } from '../utils/hmacUtil.js';
import type { AuthCacheStore, AuthContext, ScreenAuthRecord, VendorAuthRecord } from '../types/auth.types.js';

const MASTER_SECRET = 'base64:' + Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');

// Simulates CMS HmacKeyUtil issuer for test vectors
const issueScreenKey = (code: string, secret = MASTER_SECRET): string => {
	const nonce = crypto.randomBytes(16).toString('hex');
	const sig = crypto.createHmac('sha256', resolveMasterSecret(secret)).update(`screen:${code}:${nonce}`).digest('hex').slice(0, 32);
	return nonce + sig;
};

const signTestPayload = (payload: string, secret: string): string => crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

const createMemoryStore = (entries: Record<string, unknown> = {}) => {
	const map = new Map<string, string>(Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)]));
	let calls = 0;
	const store: AuthCacheStore = {
		get: async (key: string) => {
			calls += 1;
			return map.get(key) ?? null;
		},
	};
	return { store, getCalls: () => calls, set: (k: string, v: unknown) => map.set(k, JSON.stringify(v)) };
};

describe('Auth Module - HMAC & Scoped Key Parity', () => {
	it('verifies scoped keys with base64 master secret and rejects tampering', () => {
		const key = issueScreenKey('SCR-HN-01');
		assert.equal(key.length, 64);
		assert.equal(verifyScopedKey(key, 'screen', 'SCR-HN-01', MASTER_SECRET), true);
		assert.equal(verifyScopedKey(key, 'screen', 'SCR-HN-02', MASTER_SECRET), false);
		assert.equal(verifyScopedKey(key, 'vendor', 'SCR-HN-01', MASTER_SECRET), false);
		assert.equal(verifyScopedKey(key.slice(0, -2) + 'ff', 'screen', 'SCR-HN-01', MASTER_SECRET), false);
		assert.equal(verifyScopedKey('short', 'screen', 'SCR-HN-01', MASTER_SECRET), false);
	});

	it('builds auth route rules dynamically from configurable API prefix', () => {
		const v2Rules = buildDefaultAuthRules('/api/v2/');
		assert.ok(v2Rules.some((r) => r.prefix === '/api/v2/venue/' && r.policy === 'screen_or_vendor'));
		assert.ok(v2Rules.some((r) => r.prefix === '/api/v2/partner/' && r.policy === 'vendor'));
		assert.ok(v2Rules.some((r) => r.prefix === '/api/v2/log/' && r.policy === 'public'));
	});
});

describe('Auth Module - AuthService Layer 1 & Layer 2', () => {
	it('blocks forged screen key at Layer 1 without touching Redis', async () => {
		const mem = createMemoryStore();
		const service = new AuthService({ store: mem.store, masterSecret: MASTER_SECRET });

		const result = await service.authenticateScreen('a'.repeat(64), 'SCR-HN-01');
		assert.equal(result.ok, false);
		assert.equal(mem.getCalls(), 0);
	});

	it('authenticates valid screen key from Redis cache and rejects rotated key', async () => {
		const validKey = issueScreenKey('SCR-HN-01');
		const oldKey = issueScreenKey('SCR-HN-01');
		const screen: ScreenAuthRecord = { screen_id: 10, venue_id: 2, vendor_id: 1, code: 'SCR-HN-01', secret_key: validKey, status: 'active' };
		const mem = createMemoryStore({ [RedisKeyHelper.screenAuth('SCR-HN-01')]: screen });
		const service = new AuthService({ store: mem.store, masterSecret: MASTER_SECRET });

		const okRes = await service.authenticateScreen(validKey, 'SCR-HN-01');
		assert.equal(okRes.ok, true);
		if (okRes.ok && okRes.auth.type === 'screen') assert.equal(okRes.auth.screen.screen_id, 10);

		const rotatedRes = await service.authenticateScreen(oldKey, 'SCR-HN-01');
		assert.equal(rotatedRes.ok, false);
	});

	it('supports optional Layer 3 fallback hook on cache miss', async () => {
		const validKey = issueScreenKey('SCR-FALLBACK-01');
		const mem = createMemoryStore();
		const service = new AuthService({
			store: mem.store,
			masterSecret: MASTER_SECRET,
			fallback: {
				resolveScreen: async (code, key) => ({ screen_id: 99, venue_id: 5, vendor_id: 3, code, secret_key: key, status: 'active' }),
			},
		});

		const res = await service.authenticateScreen(validKey, 'SCR-FALLBACK-01');
		assert.equal(res.ok, true);
		if (res.ok && res.auth.type === 'screen') assert.equal(res.auth.screen.screen_id, 99);
	});

	it('authenticates vendor key via sha256 cache lookup and rejects inactive vendor', async () => {
		const activeKey = 'dooh_live_active1234567890';
		const inactiveKey = 'dooh_live_inactive1234567890';
		const activeVendor: VendorAuthRecord = { vendor_id: 7, name: 'Ureka', status: 'active', rate_limit_per_min: 120 };
		const inactiveVendor: VendorAuthRecord = { vendor_id: 8, name: 'Blocked', status: 'suspended' };

		const mem = createMemoryStore({
			[RedisKeyHelper.vendorAuth(sha256Hex(activeKey))]: activeVendor,
			[RedisKeyHelper.vendorAuth(sha256Hex(inactiveKey))]: inactiveVendor,
		});
		const service = new AuthService({ store: mem.store, masterSecret: MASTER_SECRET });

		const okRes = await service.authenticateVendor(activeKey);
		assert.equal(okRes.ok, true);
		const badRes = await service.authenticateVendor(inactiveKey);
		assert.equal(badRes.ok, false);
		const badPrefix = await service.authenticateVendor('invalid_prefix_key');
		assert.equal(badPrefix.ok, false);
	});
});

describe('Auth Module - Central AuthGuard HTTP Integration', () => {
	let server: http.Server;
	let baseUrl: string;
	const screenCode = 'SCR-SG-01';
	const screenKey = issueScreenKey(screenCode);
	const vendorKey = 'dooh_live_partnerkey999999';

	before(async () => {
		const screen: ScreenAuthRecord = { screen_id: 42, venue_id: 12, vendor_id: 7, code: screenCode, secret_key: screenKey, status: 'active' };
		const vendor: VendorAuthRecord = { vendor_id: 7, name: 'Partner A', status: 'active' };
		const mem = createMemoryStore({
			[RedisKeyHelper.screenAuth(screenCode)]: screen,
			[RedisKeyHelper.vendorAuth(sha256Hex(vendorKey))]: vendor,
		});
		const service = new AuthService({ store: mem.store, masterSecret: MASTER_SECRET });

		const router = new Router();
		router.get('/api/v1/log/imp/:hash', (_req, res) => sendSuccess(res, { beacon: true }));
		router.get('/api/v1/venue/:code', (_req, res, ctx) => sendSuccess(res, { code: ctx.params.code, auth: ctx.auth as AuthContext }));
		router.get('/api/v1/partner/screens', (_req, res, ctx) => sendSuccess(res, { auth: ctx.auth as AuthContext }));
		router.get('/api/v1/player/config', (_req, res, ctx) => sendSuccess(res, { auth: ctx.auth as AuthContext }));
		router.post('/api/v1/player/heartbeat', [requireHmacSignature(service)], (_req, res, ctx) => sendSuccess(res, { signed: true, auth: ctx.auth }));

		const app = createApp(router, [createAuthGuard({ service })]);
		server = http.createServer(app);
		await new Promise<void>((resolve) => {
			server.listen(0, () => {
				const addr = server.address() as AddressInfo;
				baseUrl = `http://127.0.0.1:${addr.port}`;
				resolve();
			});
		});
	});

	after(async () => {
		await new Promise<void>((resolve) => server.close(() => resolve()));
	});

	it('allows public beacon routes without auth headers', async () => {
		const res = await fetch(`${baseUrl}/api/v1/log/imp/somehash`);
		assert.equal(res.status, 200);
	});

	it('protects /api/v1/venue/:code via AuthGuard without Venue doing any auth', async () => {
		const unauth = await fetch(`${baseUrl}/api/v1/venue/${screenCode}`);
		assert.equal(unauth.status, 401);

		const withScreen = await fetch(`${baseUrl}/api/v1/venue/${screenCode}`, { headers: { 'X-DOOH-SCREEN-KEY': screenKey } });
		assert.equal(withScreen.status, 200);
		const body = (await withScreen.json()) as { data: { code: string; auth: AuthContext } };
		assert.equal(body.data.code, screenCode);
		assert.equal(body.data.auth.type, 'screen');

		const withVendor = await fetch(`${baseUrl}/api/v1/venue/${screenCode}`, { headers: { 'X-DOOH-API-KEY': vendorKey } });
		assert.equal(withVendor.status, 200);
	});

	it('enforces strict dual-key separation on /partner and /player routes', async () => {
		const screenOnPartner = await fetch(`${baseUrl}/api/v1/partner/screens`, { headers: { 'X-DOOH-SCREEN-KEY': screenKey } });
		assert.equal(screenOnPartner.status, 401);

		const vendorOnPartner = await fetch(`${baseUrl}/api/v1/partner/screens`, { headers: { 'X-DOOH-API-KEY': vendorKey } });
		assert.equal(vendorOnPartner.status, 200);

		const vendorOnPlayer = await fetch(`${baseUrl}/api/v1/player/config?screen_code=${screenCode}`, { headers: { 'X-DOOH-API-KEY': vendorKey } });
		assert.equal(vendorOnPlayer.status, 401);

		const screenOnPlayer = await fetch(`${baseUrl}/api/v1/player/config?screen_code=${screenCode}`, { headers: { 'X-DOOH-SCREEN-KEY': screenKey } });
		assert.equal(screenOnPlayer.status, 200);
	});

	it('verifies HMAC request signature and rejects expired timestamps', async () => {
		const now = String(Math.floor(Date.now() / 1000));
		const canonical = `POST:/api/v1/player/heartbeat`;
		const validSig = signTestPayload(`${now}.${canonical}`, screenKey);

		const okRes = await fetch(`${baseUrl}/api/v1/player/heartbeat?screen_code=${screenCode}`, {
			method: 'POST',
			headers: { 'X-DOOH-SCREEN-KEY': screenKey, 'X-DOOH-TIMESTAMP': now, 'X-DOOH-SIGNATURE': validSig },
		});
		assert.equal(okRes.status, 200);

		const oldTs = String(Math.floor(Date.now() / 1000) - 999);
		const expiredSig = signTestPayload(`${oldTs}.${canonical}`, screenKey);
		const expiredRes = await fetch(`${baseUrl}/api/v1/player/heartbeat?screen_code=${screenCode}`, {
			method: 'POST',
			headers: { 'X-DOOH-SCREEN-KEY': screenKey, 'X-DOOH-TIMESTAMP': oldTs, 'X-DOOH-SIGNATURE': expiredSig },
		});
		assert.equal(expiredRes.status, 401);
	});
});
