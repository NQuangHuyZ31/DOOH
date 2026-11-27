import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Router } from '@core/router/router.js';
import { createApp } from '@core/app.js';
import { encryptToken } from '@core/utils/tokenCrypto.js';
import { createAuthGuard } from '@modules/Auth/index.js';
import { buildTrackingUrls } from '../utils/trackingUrlUtil.js';
import { LogService, maskIp, resolveDedupTtl } from '../services/logService.js';
import { createLogRouter } from '../routes.js';
import type { AtomicBeaconRecordParams, LogBeaconStore, RawTrackingLogEvent } from '../types/log.types.js';

const TEST_APP_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const createMemoryBeaconStore = () => {
	const dedup = new Set<string>();
	const capCounts = new Map<string, number>();
	const stats = new Map<string, { imp: number; complete: number }>();
	const queue: RawTrackingLogEvent[] = [];
	let calls = 0;

	const store: LogBeaconStore = {
		recordAtomic: async (params: AtomicBeaconRecordParams): Promise<boolean> => {
			calls += 1;
			if (dedup.has(params.dedupKey)) return false;
			dedup.add(params.dedupKey);

			if (params.eventType === 'imp') {
				capCounts.set(params.capKey, (capCounts.get(params.capKey) ?? 0) + 1);
			}
			const current = stats.get(params.statKey) ?? { imp: 0, complete: 0 };
			current[params.eventType] += 1;
			stats.set(params.statKey, current);
			queue.push(JSON.parse(params.rawPayload) as RawTrackingLogEvent);
			return true;
		},
	};

	return { store, dedup, capCounts, stats, queue, getCalls: () => calls };
};

describe('Log Module - IP Masking & Dedup Bucket', () => {
	it('masks IPv4 and IPv6 addresses to protect PII', () => {
		assert.equal(maskIp('203.113.152.45'), '203.113.152.0');
		assert.equal(maskIp('::ffff:192.168.1.99'), '192.168.1.0');
		assert.equal(maskIp('10.0.0.5, 172.16.0.1'), '10.0.0.0');
		assert.equal(maskIp('2001:db8:85a3:0:0:8a2e:370:7334'), '2001:db8:85a3::');
	});

	it('produces distinct client_hash across dedup windows for looped plays', async () => {
		const mem = createMemoryBeaconStore();
		let currentMs = Date.parse('2026-11-26T10:00:00.000Z');
		const service = new LogService({ store: mem.store, appKey: TEST_APP_KEY, dedupTtlSeconds: 10, nowProvider: () => new Date(currentMs) });

		const urls = buildTrackingUrls({ venue_id: 12, screen_id: 42, line_item_id: 105, creative_id: 33, ttlSeconds: 600 }, { appUrl: 'http://localhost', apiPrefix: '/api/v1', appKey: TEST_APP_KEY });
		const hash = urls.impression_url.split('/').pop() as string;

		assert.equal(await service.ingestBeacon({ eventType: 'imp', hash, ip: '192.168.1.50', userAgent: 'DOOH-Player/1.0' }), 'recorded');

		// Simulate dedup TTL expiring and slot looping 15s later with same hash
		mem.dedup.clear();
		currentMs += 15_000;
		assert.equal(await service.ingestBeacon({ eventType: 'imp', hash, ip: '192.168.1.50', userAgent: 'DOOH-Player/1.0' }), 'recorded');

		assert.equal(mem.queue.length, 2);
		assert.notEqual(mem.queue[0].client_hash, mem.queue[1].client_hash);
		assert.equal(mem.capCounts.get('cap:daily:2026-11-26:105'), 2);
	});

	it('computes dynamic dedup TTL from slot duration clamped to [3, 60] seconds', async () => {
		assert.equal(resolveDedupTtl(8, 10), 6);
		assert.equal(resolveDedupTtl(15, 10), 13);
		assert.equal(resolveDedupTtl(30, 10), 28);
		assert.equal(resolveDedupTtl(4, 10), 3);
		assert.equal(resolveDedupTtl(120, 10), 60);
		assert.equal(resolveDedupTtl(undefined, 10), 10);

		let capturedTtl = 0;
		const store: LogBeaconStore = {
			recordAtomic: async (params: AtomicBeaconRecordParams) => {
				capturedTtl = params.dedupTtlSeconds;
				return true;
			},
		};
		const service = new LogService({ store, appKey: TEST_APP_KEY, dedupTtlSeconds: 10 });
		const urls = buildTrackingUrls({ venue_id: 12, screen_id: 42, line_item_id: 105, creative_id: 33, duration: 8, ttlSeconds: 600 }, { appUrl: 'http://localhost', apiPrefix: '/api/v1', appKey: TEST_APP_KEY });
		const hash = urls.impression_url.split('/').pop() as string;

		assert.equal(await service.ingestBeacon({ eventType: 'imp', hash, ip: '192.168.1.50', userAgent: 'DOOH-Player/1.0' }), 'recorded');
		assert.equal(capturedTtl, 6);
	});
});

describe('Log Module - HTTP Beacon Endpoints (204 No Content)', () => {
	let server: http.Server;
	let baseUrl: string;
	const mem = createMemoryBeaconStore();
	const fixedDate = '2026-11-26';

	before(async () => {
		const service = new LogService({
			store: mem.store,
			appKey: TEST_APP_KEY,
			dedupTtlSeconds: 10,
			nowProvider: () => new Date(`${fixedDate}T11:00:00.000Z`),
		});

		const router = new Router();
		router.mount('/api/v1/log', createLogRouter(service));
		const app = createApp(router, [createAuthGuard({ apiPrefix: '/api/v1' })]);

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

	it('records imp and complete via public 204 endpoints, deduplicating duplicate imp without blocking complete', async () => {
		const urls = buildTrackingUrls({ venue_id: 12, screen_id: 42, line_item_id: 101, creative_id: 11, ttlSeconds: 600 }, { appUrl: baseUrl, apiPrefix: '/api/v1', appKey: TEST_APP_KEY });

		const imp1 = await fetch(urls.impression_url, { headers: { 'x-forwarded-for': '203.113.152.88', 'user-agent': 'Player/2.0' } });
		assert.equal(imp1.status, 204);

		// Duplicate imp within dedup window -> still 204, not counted twice
		const imp2 = await fetch(urls.impression_url);
		assert.equal(imp2.status, 204);

		// Complete beacon with SAME hash -> allowed because dedup key includes event_type
		const comp = await fetch(urls.complete_url);
		assert.equal(comp.status, 204);

		assert.equal(mem.capCounts.get(`cap:daily:${fixedDate}:101`), 1);
		assert.deepEqual(mem.stats.get(`stat:${fixedDate}:101:12:42`), { imp: 1, complete: 1 });
		assert.equal(mem.queue.length, 2);
		assert.equal(mem.queue[0].ip, '203.113.152.0');
		assert.equal(mem.queue[0].screen_id, 42);
	});

	it('returns 404 for invalid and expired tokens without touching Redis', async () => {
		const callsBefore = mem.getCalls();

		const badRes = await fetch(`${baseUrl}/api/v1/log/imp/invalid-corrupted-hash-value`);
		assert.equal(badRes.status, 404);

		const expiredHash = encryptToken({ venue_id: 12, line_item_id: 101, exp: Math.floor(Date.now() / 1000) - 60 }, TEST_APP_KEY);
		const expiredRes = await fetch(`${baseUrl}/api/v1/log/imp/${expiredHash}`);
		assert.equal(expiredRes.status, 404);

		assert.equal(mem.getCalls(), callsBefore);
	});
});
