import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Router } from '@core/router/router.js';
import { createApp } from '@core/app.js';
import { CmsClient } from '@core/utils/cmsClient.js';
import { readJsonBody, sendError, sendSuccess } from '@core/utils/httpUtil.js';
import { RedisKeyHelper, type CacheStore } from '@database';
import { AuthService, createAuthGuard, resolveMasterSecret, sha256Hex, type ScreenAuthRecord, type VendorAuthRecord } from '@modules/Auth/index.js';
import { createVenueRouter, VenueService } from '../index.js';

const MASTER_SECRET = 'base64:' + Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
const INTERNAL_SECRET = 'test-internal-venue-secret';

const issueScreenKey = (code: string): string => {
	const nonce = crypto.randomBytes(16).toString('hex');
	const sig = crypto.createHmac('sha256', resolveMasterSecret(MASTER_SECRET)).update(`screen:${code}:${nonce}`).digest('hex').slice(0, 32);
	return nonce + sig;
};

const createMemoryStore = (entries: Record<string, unknown> = {}): CacheStore => {
	const map = new Map<string, string>(Object.entries(entries).map(([k, v]) => [k, JSON.stringify(v)]));
	return {
		get: async (key: string) => map.get(key) ?? null,
		setex: async (key: string, _ttl: number, value: string) => {
			map.set(key, value);
		},
	};
};

describe('Venue Module - HTTP Integration with AuthGuard & Upstream CMS', () => {
	let cmsServer: http.Server;
	let apiServer: http.Server;
	let apiBaseUrl: string;
	const screenCode = 'SCR-VN-01';
	const screenKey = issueScreenKey(screenCode);
	const vendorKey = 'dooh_live_venuepartner999';
	const registeredHardwareUids = new Set<string>();

	before(async () => {
		const cmsRouter = new Router();
		cmsRouter.post('/admin/api/internal/venue/screens', async (req, res) => {
			if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) return sendError(res, 401, 'Unauthorized');
			const body = await readJsonBody<Record<string, unknown>>(req);
			const hwUid = typeof body.hardware_device_uid === 'string' ? body.hardware_device_uid : '';
			if (hwUid && registeredHardwareUids.has(hwUid)) return sendError(res, 409, 'hardware_device_uid already registered');
			if (hwUid) registeredHardwareUids.add(hwUid);
			sendSuccess(
				res,
				{
					code: 'SCR-NEW-01',
					secret_key: 'dsk_live_generated_secret',
					name: body.name,
					location_name: body.location_name,
					city: body.city,
					screen_type: body.screen_type ?? 'outdoor_led',
					resolution_width: body.resolution_width,
					resolution_height: body.resolution_height,
					orientation: 'landscape',
					aspect_ratio: '16:9',
					has_audio: false,
					loop_duration_seconds: 120,
					default_slot_seconds: 15,
					hardware_device_uid: hwUid || null,
					status: 'active',
				},
				'Screen registered',
				201,
			);
		});

		cmsRouter.post('/admin/api/internal/venue/screens/batch', async (req, res) => {
			if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) return sendError(res, 401, 'Unauthorized');
			const body = await readJsonBody<{ vendor_id: number; screens: Array<Record<string, unknown>> }>(req);
			const created: Array<Record<string, unknown>> = [];
			const failed: Array<Record<string, unknown>> = [];
			body.screens.forEach((item, index) => {
				const hwUid = typeof item.hardware_device_uid === 'string' ? item.hardware_device_uid : '';
				if (!item.name || (hwUid && registeredHardwareUids.has(hwUid))) {
					failed.push({ index, hardware_device_uid: hwUid || null, name: (item.name as string) ?? null, error: 'hardware_device_uid already registered' });
					return;
				}
				if (hwUid) registeredHardwareUids.add(hwUid);
				created.push({ index, code: `SCR-BATCH-${index + 1}`, secret_key: `dsk_batch_${index + 1}`, name: item.name, location_name: item.location_name, city: item.city, hardware_device_uid: hwUid || null });
			});
			sendSuccess(res, { total: body.screens.length, created_count: created.length, failed_count: failed.length, created, failed });
		});

		cmsRouter.get('/admin/api/internal/venue/screens', (req, res, ctx) => {
			if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) return sendError(res, 401, 'Unauthorized');
			sendSuccess(res, [{ code: screenCode, name: 'Lobby LED', location_name: 'Landmark 81', city: 'Ho Chi Minh', vendor_echo: Number(ctx.query.get('vendor_id')) }]);
		});

		cmsRouter.get('/admin/api/internal/venue/screens/config', (req, res, ctx) => {
			if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) return sendError(res, 401, 'Unauthorized');
			sendSuccess(res, { code: ctx.query.get('code'), name: 'Lobby LED', resolution_width: 1920, resolution_height: 1080, loop_duration_seconds: 120, default_slot_seconds: 15 });
		});

		cmsRouter.post('/admin/api/internal/venue/screens/heartbeat', async (req, res) => {
			if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) return sendError(res, 401, 'Unauthorized');
			const body = await readJsonBody<{ code: string }>(req);
			sendSuccess(res, { code: body.code, connectivity_status: 'online', last_heartbeat_at: '2026-11-26T16:00:00Z' });
		});

		cmsServer = http.createServer(createApp(cmsRouter));
		const cmsBaseUrl = await new Promise<string>((resolve) => {
			cmsServer.listen(0, () => {
				const addr = cmsServer.address() as AddressInfo;
				resolve(`http://127.0.0.1:${addr.port}`);
			});
		});

		const screen: ScreenAuthRecord = { screen_id: 10, venue_id: 3, vendor_id: 77, code: screenCode, secret_key: screenKey, status: 'active' };
		const vendor: VendorAuthRecord = { vendor_id: 77, name: 'Partner Venue', status: 'active' };
		const authService = new AuthService({
			store: createMemoryStore({ [RedisKeyHelper.screenAuth(screenCode)]: screen, [RedisKeyHelper.vendorAuth(sha256Hex(vendorKey))]: vendor }),
			masterSecret: MASTER_SECRET,
		});
		const cmsClient = new CmsClient({ baseUrl: cmsBaseUrl, internalPrefix: '/admin/api/internal', internalSecret: INTERNAL_SECRET });
		const venueService = new VenueService({ cmsClient });

		const apiRouter = new Router();
		apiRouter.mount('/api/v1/venue', createVenueRouter(venueService));
		apiServer = http.createServer(createApp(apiRouter, [createAuthGuard({ service: authService })]));
		apiBaseUrl = await new Promise<string>((resolve) => {
			apiServer.listen(0, () => {
				const addr = apiServer.address() as AddressInfo;
				resolve(`http://127.0.0.1:${addr.port}`);
			});
		});
	});

	after(async () => {
		await new Promise<void>((resolve) => apiServer.close(() => resolve()));
		await new Promise<void>((resolve) => cmsServer.close(() => resolve()));
	});

	it('registers a single screen via vendor key and rejects duplicate hardware_device_uid with 409', async () => {
		const payload = { name: 'Lobby LED 01', location_name: 'Landmark 81', city: 'Ho Chi Minh', resolution_width: 1920, resolution_height: 1080, hardware_device_uid: 'HW-UNIQUE-01' };

		const res = await fetch(`${apiBaseUrl}/api/v1/venue/screens`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-DOOH-API-KEY': vendorKey },
			body: JSON.stringify(payload),
		});
		assert.equal(res.status, 201);
		const body = (await res.json()) as { data: { code: string; secret_key: string } };
		assert.equal(body.data.code, 'SCR-NEW-01');
		assert.equal(body.data.secret_key, 'dsk_live_generated_secret');

		const dup = await fetch(`${apiBaseUrl}/api/v1/venue/screens`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-DOOH-API-KEY': vendorKey },
			body: JSON.stringify(payload),
		});
		assert.equal(dup.status, 409);
	});

	it('supports batch registration with partial success and enforces max 100 screens limit', async () => {
		const res = await fetch(`${apiBaseUrl}/api/v1/venue/screens/batch`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-DOOH-API-KEY': vendorKey },
			body: JSON.stringify({
				screens: [
					{ name: 'Lobby LED 02', location_name: 'Landmark 81', city: 'Ho Chi Minh', resolution_width: 1920, resolution_height: 1080, hardware_device_uid: 'HW-BATCH-01' },
					{ name: 'Duplicate LED', location_name: 'Landmark 81', city: 'Ho Chi Minh', resolution_width: 1920, resolution_height: 1080, hardware_device_uid: 'HW-UNIQUE-01' },
				],
			}),
		});
		assert.equal(res.status, 200);
		const body = (await res.json()) as { data: { total: number; created_count: number; failed_count: number } };
		assert.equal(body.data.total, 2);
		assert.equal(body.data.created_count, 1);
		assert.equal(body.data.failed_count, 1);

		const tooMany = await fetch(`${apiBaseUrl}/api/v1/venue/screens/batch`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-DOOH-API-KEY': vendorKey },
			body: JSON.stringify({ screens: Array.from({ length: 101 }, (_, i) => ({ name: `S-${i}` })) }),
		});
		assert.equal(tooMany.status, 422);
	});

	it('lists vendor screens and enforces vendor-only auth on /screens', async () => {
		const screenAttempt = await fetch(`${apiBaseUrl}/api/v1/venue/screens`, { headers: { 'X-DOOH-SCREEN-KEY': screenKey } });
		assert.equal(screenAttempt.status, 401);

		const res = await fetch(`${apiBaseUrl}/api/v1/venue/screens`, { headers: { 'X-DOOH-API-KEY': vendorKey } });
		assert.equal(res.status, 200);
		const body = (await res.json()) as { data: Array<{ code: string }> };
		assert.equal(body.data[0].code, screenCode);
	});

	it('serves screen config and records heartbeat with screen-only auth', async () => {
		const vendorAttempt = await fetch(`${apiBaseUrl}/api/v1/venue/screens/${screenCode}/config`, { headers: { 'X-DOOH-API-KEY': vendorKey } });
		assert.equal(vendorAttempt.status, 401);

		const cfgRes = await fetch(`${apiBaseUrl}/api/v1/venue/screens/${screenCode}/config`, { headers: { 'X-DOOH-SCREEN-KEY': screenKey } });
		assert.equal(cfgRes.status, 200);
		const cfgBody = (await cfgRes.json()) as { data: { code: string; resolution_width: number } };
		assert.equal(cfgBody.data.code, screenCode);
		assert.equal(cfgBody.data.resolution_width, 1920);

		const hbRes = await fetch(`${apiBaseUrl}/api/v1/venue/screens/${screenCode}/heartbeat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-DOOH-SCREEN-KEY': screenKey },
			body: JSON.stringify({ player_app_version: '2.1.0', storage_free_mb: 2048 }),
		});
		assert.equal(hbRes.status, 200);
		const hbBody = (await hbRes.json()) as { data: { connectivity_status: string } };
		assert.equal(hbBody.data.connectivity_status, 'online');
	});
});
