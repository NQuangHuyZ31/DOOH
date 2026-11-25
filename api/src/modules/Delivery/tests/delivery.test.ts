import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Router } from '@core/router/router.js';
import { createApp } from '@core/app.js';
import { CmsClient } from '@core/utils/cmsClient.js';
import { decryptToken } from '@core/utils/tokenCrypto.js';
import { RedisKeyHelper, type CacheStore } from '@database';
import { AuthService, createAuthGuard, resolveMasterSecret, sha256Hex } from '@modules/Auth/index.js';
import type { ScreenAuthRecord, VendorAuthRecord } from '@modules/Auth/types/auth.types.js';
import { buildTrackingUrls } from '@modules/Log/index.js';
import { DeliveryService } from '../services/deliveryService.js';
import { createDeliveryRouter } from '../routes.js';
import type { CachedPlaylist, DeliveryPlaylistResponse } from '../types/delivery.types.js';

const MASTER_SECRET = 'base64:' + Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
const TEST_APP_KEY = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
const FIXED_DATE = '2026-11-25';

const issueScreenKey = (code: string): string => {
	const nonce = crypto.randomBytes(16).toString('hex');
	const sig = crypto.createHmac('sha256', resolveMasterSecret(MASTER_SECRET)).update(`screen:${code}:${nonce}`).digest('hex').slice(0, 32);
	return nonce + sig;
};

const createMemoryStore = (entries: Record<string, unknown> = {}): CacheStore & { has: (k: string) => boolean } => {
	const map = new Map<string, string>(Object.entries(entries).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
	return {
		get: async (key: string) => map.get(key) ?? null,
		mget: async (keys: string[]) => keys.map((k) => map.get(k) ?? null),
		setex: async (key: string, _ttl: number, value: string) => {
			map.set(key, value);
		},
		has: (key: string) => map.has(key),
	};
};

describe('Delivery Module - Playlist, Daily Cap & Log Tracking URLs', () => {
	let server: http.Server;
	let baseUrl: string;
	const screenCode = 'SCR-HN-01';
	const otherScreenCode = 'SCR-OTHER-01';
	const screenKey = issueScreenKey(screenCode);
	const vendorKey = 'dooh_live_vendor_delivery_test';

	before(async () => {
		const screen: ScreenAuthRecord = { screen_id: 42, venue_id: 12, vendor_id: 7, code: screenCode, secret_key: screenKey, status: 'active' };
		const otherScreen: ScreenAuthRecord = { screen_id: 99, venue_id: 55, vendor_id: 88, code: otherScreenCode, secret_key: issueScreenKey(otherScreenCode), status: 'active' };
		const vendor: VendorAuthRecord = { vendor_id: 7, name: 'Ureka', status: 'active' };

		const screenPlaylist: CachedPlaylist = {
			screen_id: 42,
			venue_id: 12,
			orientation: 'landscape',
			refresh_seconds: 180,
			playlist: [
				{ line_item_id: 101, line_item_name: 'Active Ad', campaign_id: 1, creative_id: 11, priority: 10, type: 'video', media_url: 'https://cdn.test/a.mp4', duration: 15, daily_impression_cap: 1000 },
				{ line_item_id: 102, line_item_name: 'Capped Ad', campaign_id: 2, creative_id: 12, priority: 8, type: 'image', media_url: 'https://cdn.test/b.jpg', duration: 15, daily_impression_cap: 500 },
				{ line_item_id: 103, line_item_name: 'Near Cap Ad', campaign_id: 3, creative_id: 13, priority: 5, type: 'video', media_url: 'https://cdn.test/c.mp4', duration: 20, daily_impression_cap: 100 },
			],
		};

		const store = createMemoryStore({
			[RedisKeyHelper.screenAuth(screenCode)]: screen,
			[RedisKeyHelper.screenAuth(otherScreenCode)]: otherScreen,
			[RedisKeyHelper.vendorAuth(sha256Hex(vendorKey))]: vendor,
			[RedisKeyHelper.playlistScreen(42)]: screenPlaylist,
			[RedisKeyHelper.capDaily(FIXED_DATE, 101)]: '200',
			[RedisKeyHelper.capDaily(FIXED_DATE, 102)]: '500',
			[RedisKeyHelper.capDaily(FIXED_DATE, 103)]: '95',
		});

		const authService = new AuthService({ store, masterSecret: MASTER_SECRET });
		const deliveryService = new DeliveryService({
			store,
			nowProvider: () => new Date(`${FIXED_DATE}T10:00:00.000Z`),
			trackingUrlBuilder: (input) => buildTrackingUrls(input, { appUrl: 'https://api.dooh.test', apiPrefix: '/api/v1', appKey: TEST_APP_KEY }),
		});

		const router = new Router();
		router.mount('/api/v1/delivery', createDeliveryRouter(deliveryService));
		const app = createApp(router, [createAuthGuard({ service: authService, apiPrefix: '/api/v1' })]);

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

	it('rejects unauthenticated requests via AuthGuard with 401', async () => {
		const res = await fetch(`${baseUrl}/api/v1/delivery/playlist?screen_code=${screenCode}`);
		assert.equal(res.status, 401);
	});

	it('returns filtered playlist with Log-generated AES-256-GCM tracking URLs and soft-cap refresh', async () => {
		const res = await fetch(`${baseUrl}/api/v1/delivery/playlist?screen_code=${screenCode}`, {
			headers: { 'X-DOOH-SCREEN-KEY': screenKey },
		});
		assert.equal(res.status, 200);

		const body = (await res.json()) as { status: string; data: DeliveryPlaylistResponse };
		assert.equal(body.status, 'success');
		assert.equal(body.data.screen_id, 42);
		assert.equal(body.data.venue_id, 12);
		assert.equal(body.data.slots_count, 2); // LineItem 102 (500/500) filtered out
		assert.equal(body.data.refresh_seconds, 60); // Shortened because LineItem 103 is at 95% cap
		assert.equal(body.data.total_duration_seconds, 35);

		const first = body.data.playlist[0];
		assert.equal(first.line_item_id, 101);
		assert.ok(first.tracking.impression_url.startsWith('https://api.dooh.test/api/v1/log/imp/'));
		assert.ok(first.tracking.complete_url.startsWith('https://api.dooh.test/api/v1/log/complete/'));

		// Decrypt hash produced by Log module to verify payload integrity
		const hash = first.tracking.impression_url.split('/').pop() as string;
		const token = decryptToken(hash, TEST_APP_KEY);
		assert.ok(token !== null);
		assert.equal(token.venue_id, 12);
		assert.equal(token.line_item_id, 101);
		assert.equal(token.screen_id, 42);
		assert.equal(token.creative_id, 11);
	});

	it('blocks Vendor from fetching another Vendor screen playlist with 403', async () => {
		const ownRes = await fetch(`${baseUrl}/api/v1/delivery/playlist?screen_code=${screenCode}`, {
			headers: { 'X-DOOH-API-KEY': vendorKey },
		});
		assert.equal(ownRes.status, 200);

		const crossRes = await fetch(`${baseUrl}/api/v1/delivery/playlist?screen_code=${otherScreenCode}`, {
			headers: { 'X-DOOH-API-KEY': vendorKey },
		});
		assert.equal(crossRes.status, 403);
	});

	it('returns empty playlist with 200 when cache misses and falls back to venue playlist when screen cache absent', async () => {
		const venuePlaylist: CachedPlaylist = {
			venue_id: 20,
			playlist: [{ line_item_id: 201, type: 'image', media_url: 'https://cdn.test/v.jpg', duration: 10 }],
		};
		const store = createMemoryStore({ [RedisKeyHelper.playlist(20)]: venuePlaylist });
		const service = new DeliveryService({
			store,
			trackingUrlBuilder: (input) => buildTrackingUrls(input, { appUrl: 'https://api.dooh.test', apiPrefix: '/api/v1', appKey: TEST_APP_KEY }),
		});

		const venueFallback = await service.getPlaylist({ type: 'screen', screen: { screen_id: 77, venue_id: 20, vendor_id: 1, code: 'S-77', secret_key: 'k', status: 'active' } }, {});
		assert.equal(venueFallback.ok, true);
		if (venueFallback.ok) assert.equal(venueFallback.data.slots_count, 1);

		const emptyMiss = await service.getPlaylist({ type: 'screen', screen: { screen_id: 88, venue_id: 99, vendor_id: 1, code: 'S-88', secret_key: 'k', status: 'active' } }, {});
		assert.equal(emptyMiss.ok, true);
		if (emptyMiss.ok) {
			assert.equal(emptyMiss.data.slots_count, 0);
			assert.deepEqual(emptyMiss.data.playlist, []);
			assert.equal(emptyMiss.data.refresh_seconds, 120);
		}
	});

	it('falls back to CMS on cache miss, deduplicates concurrent calls, and warms Redis cache', async () => {
		let cmsHits = 0;
		const cmsServer = http.createServer((req, res) => {
			cmsHits += 1;
			if (req.headers['x-internal-secret'] !== 'super-internal-secret') {
				res.writeHead(401, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ status: 'error' }));
				return;
			}
			setTimeout(() => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(
					JSON.stringify({
						status: 'success',
						data: {
							screen_id: 77,
							venue_id: 25,
							refresh_seconds: 150,
							playlist: [{ line_item_id: 301, type: 'video', media_url: 'https://cdn.test/cms.mp4', duration: 15 }],
						},
					}),
				);
			}, 30);
		});

		await new Promise<void>((resolve) => cmsServer.listen(0, () => resolve()));
		const cmsAddr = cmsServer.address() as AddressInfo;

		try {
			const store = createMemoryStore();
			const cmsClient = new CmsClient({ baseUrl: `http://127.0.0.1:${cmsAddr.port}`, internalSecret: 'super-internal-secret', timeoutMs: 2000 });
			const service = new DeliveryService({
				store,
				cmsClient,
				trackingUrlBuilder: (input) => buildTrackingUrls(input, { appUrl: 'https://api.dooh.test', apiPrefix: '/api/v1', appKey: TEST_APP_KEY }),
			});
			const auth = { type: 'screen' as const, screen: { screen_id: 77, venue_id: 25, vendor_id: 1, code: 'S-77', secret_key: 'k', status: 'active' as const } };

			// Two concurrent cache misses hit CMS only once (anti-stampede)
			const [r1, r2] = await Promise.all([service.getPlaylist(auth, {}), service.getPlaylist(auth, {})]);
			assert.equal(r1.ok, true);
			assert.equal(r2.ok, true);
			assert.equal(cmsHits, 1);
			assert.equal(store.has(RedisKeyHelper.playlistScreen(77)), true);

			// Subsequent call reads directly from warmed Redis cache (0 extra CMS hits)
			const r3 = await service.getPlaylist(auth, {});
			assert.equal(r3.ok, true);
			assert.equal(cmsHits, 1);
		} finally {
			await new Promise<void>((resolve) => cmsServer.close(() => resolve()));
		}
	});
});
