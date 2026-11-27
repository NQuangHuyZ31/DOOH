import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateTrackingEvents, LogFlushWorker } from '../workers/logFlushWorker.js';
import type { DailyAggregatedDelta, LogFlushMongoSink, LogFlushQueueStore, RawTrackingLogEvent } from '../types/log.types.js';

const makeEvent = (overrides: Partial<RawTrackingLogEvent> & { client_hash: string }): RawTrackingLogEvent => ({
	event_type: 'imp',
	venue_id: 5,
	screen_id: 12,
	line_item_id: 101,
	creative_id: 22,
	timestamp: '2026-11-27T08:00:00.000Z',
	epoch_ms: Date.parse('2026-11-27T08:00:00.000Z'),
	ip: '192.168.1.0',
	user_agent: 'DOOH-Player/1.0',
	...overrides,
});

const createInMemoryPipeline = (initial: string[] = []) => {
	let queue = [...initial];
	const rawDocs = new Map<string, RawTrackingLogEvent>();
	const dailyReports = new Map<string, DailyAggregatedDelta>();
	let indexesEnsured = 0;

	const queueStore: LogFlushQueueStore = {
		peekBatch: async (_key, count) => queue.slice(0, count),
		trimBatch: async (_key, count) => {
			queue = queue.slice(count);
		},
	};

	const mongoSink: LogFlushMongoSink = {
		ensureIndexes: async () => {
			indexesEnsured += 1;
		},
		insertRawLogs: async (events) => {
			const inserted = new Set<number>();
			events.forEach((ev, idx) => {
				if (!rawDocs.has(ev.client_hash)) {
					rawDocs.set(ev.client_hash, ev);
					inserted.add(idx);
				}
			});
			return inserted;
		},
		upsertDailyAggregates: async (deltas) => {
			for (const d of deltas) {
				const k = `${d.date}:${d.line_item_id}:${d.venue_id}:${d.screen_id}`;
				const cur = dailyReports.get(k) ?? { ...d, impressions: 0, completes: 0 };
				cur.impressions += d.impressions;
				cur.completes += d.completes;
				dailyReports.set(k, cur);
			}
		},
	};

	return { queueStore, mongoSink, getQueue: () => queue, rawDocs, dailyReports, getIndexesEnsured: () => indexesEnsured };
};

describe('LogFlushWorker - Redis to MongoDB Batch Pipeline', () => {
	it('flushes mixed imp/complete events, aggregates by (date, line_item, venue, screen), and trims queue', async () => {
		const events = [
			makeEvent({ client_hash: 'h1', event_type: 'imp', line_item_id: 101, screen_id: 12 }),
			makeEvent({ client_hash: 'h2', event_type: 'complete', line_item_id: 101, screen_id: 12 }),
			makeEvent({ client_hash: 'h3', event_type: 'imp', line_item_id: 101, screen_id: 12 }),
			makeEvent({ client_hash: 'h4', event_type: 'imp', line_item_id: 102, screen_id: 15 }),
		];
		const mem = createInMemoryPipeline(events.map((e) => JSON.stringify(e)));
		const worker = new LogFlushWorker({ queueStore: mem.queueStore, mongoSink: mem.mongoSink, batchSize: 100 });

		const res = await worker.flushOnce();
		assert.deepEqual(res, { popped: 4, insertedRaw: 4, skippedDuplicates: 0, aggregatedBuckets: 2 });
		assert.equal(mem.getQueue().length, 0);
		assert.equal(mem.rawDocs.size, 4);
		assert.equal(mem.getIndexesEnsured(), 1);
		assert.deepEqual(mem.dailyReports.get('2026-11-27:101:5:12'), { date: '2026-11-27', line_item_id: 101, venue_id: 5, screen_id: 12, impressions: 2, completes: 1 });
		assert.deepEqual(mem.dailyReports.get('2026-11-27:102:5:15'), { date: '2026-11-27', line_item_id: 102, venue_id: 5, screen_id: 15, impressions: 1, completes: 0 });
	});

	it('is idempotent on crash recovery: re-reading same batch never double-counts daily aggregates', async () => {
		const events = [
			makeEvent({ client_hash: 'retry-1', event_type: 'imp' }),
			makeEvent({ client_hash: 'retry-2', event_type: 'complete' }),
		];
		const mem = createInMemoryPipeline(events.map((e) => JSON.stringify(e)));
		let failTrimOnce = true;
		const flakyQueue: LogFlushQueueStore = {
			peekBatch: mem.queueStore.peekBatch,
			trimBatch: async (k, c) => {
				if (failTrimOnce) {
					failTrimOnce = false;
					throw new Error('Simulated crash before LTRIM');
				}
				await mem.queueStore.trimBatch(k, c);
			},
		};

		const worker = new LogFlushWorker({ queueStore: flakyQueue, mongoSink: mem.mongoSink, batchSize: 100 });
		await assert.rejects(() => worker.flushOnce(), /Simulated crash before LTRIM/);
		assert.equal(mem.getQueue().length, 2);

		// Retry after crash: Mongo already has retry-1 and retry-2 -> 0 newly inserted, daily totals remain 1/1
		const retryRes = await worker.flushOnce();
		assert.deepEqual(retryRes, { popped: 2, insertedRaw: 0, skippedDuplicates: 2, aggregatedBuckets: 0 });
		assert.equal(mem.getQueue().length, 0);
		assert.deepEqual(mem.dailyReports.get('2026-11-27:101:5:12'), { date: '2026-11-27', line_item_id: 101, venue_id: 5, screen_id: 12, impressions: 1, completes: 1 });
	});

	it('preserves Redis queue when MongoDB write fails and skips malformed JSON safely', async () => {
		const validEv = makeEvent({ client_hash: 'ok-1', event_type: 'imp' });
		const mem = createInMemoryPipeline(['{bad-json', JSON.stringify(validEv)]);

		let mongoDown = true;
		const flakyMongo: LogFlushMongoSink = {
			ensureIndexes: mem.mongoSink.ensureIndexes,
			insertRawLogs: async (events) => {
				if (mongoDown) throw new Error('MongoDB timeout');
				return mem.mongoSink.insertRawLogs(events);
			},
			upsertDailyAggregates: mem.mongoSink.upsertDailyAggregates,
		};

		const worker = new LogFlushWorker({ queueStore: mem.queueStore, mongoSink: flakyMongo, batchSize: 100 });
		await assert.rejects(() => worker.flushOnce(), /MongoDB timeout/);
		assert.equal(mem.getQueue().length, 2);

		mongoDown = false;
		const recovered = await worker.flushOnce();
		assert.deepEqual(recovered, { popped: 2, insertedRaw: 1, skippedDuplicates: 0, aggregatedBuckets: 1 });
		assert.equal(mem.getQueue().length, 0);
		assert.equal(aggregateTrackingEvents([validEv]).length, 1);
	});
});
