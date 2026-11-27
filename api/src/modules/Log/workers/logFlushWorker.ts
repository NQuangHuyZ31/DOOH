import { getMongoDb, getReadyRedis, RedisKeyHelper } from '@database';
import { config } from '@core/config/config.js';
import type { DailyAggregatedDelta, LogFlushMongoSink, LogFlushQueueStore, LogFlushResult, RawTrackingLogEvent } from '../types/log.types.js';

const RAW_LOGS_COLLECTION = 'tracking_logs';
const DAILY_REPORTS_COLLECTION = 'daily_aggregated_reports';
const MAX_DRAIN_ROUNDS = 10;

export interface LogFlushWorkerOptions {
	queueStore?: LogFlushQueueStore;
	mongoSink?: LogFlushMongoSink;
	intervalMs?: number;
	batchSize?: number;
	queueKey?: string;
}

const defaultRedisQueueStore: LogFlushQueueStore = {
	peekBatch: async (queueKey: string, count: number): Promise<string[]> => {
		const client = await getReadyRedis();
		if (!client) return [];
		return client.lrange(queueKey, 0, count - 1);
	},
	trimBatch: async (queueKey: string, count: number): Promise<void> => {
		const client = await getReadyRedis();
		if (!client || count <= 0) return;
		await client.ltrim(queueKey, count, -1);
	},
};

const defaultMongoSink: LogFlushMongoSink = {
	ensureIndexes: async (): Promise<void> => {
		const db = await getMongoDb();
		await Promise.all([
			db.collection(RAW_LOGS_COLLECTION).createIndex({ client_hash: 1 }, { unique: true }),
			db.collection(RAW_LOGS_COLLECTION).createIndex({ line_item_id: 1, epoch_ms: -1 }),
			db.collection(RAW_LOGS_COLLECTION).createIndex({ screen_id: 1, epoch_ms: -1 }),
			db.collection(DAILY_REPORTS_COLLECTION).createIndex({ date: 1, line_item_id: 1, venue_id: 1, screen_id: 1 }, { unique: true }),
			db.collection(DAILY_REPORTS_COLLECTION).createIndex({ date: 1, venue_id: 1 }),
		]);
	},
	insertRawLogs: async (events: RawTrackingLogEvent[]): Promise<Set<number>> => {
		if (events.length === 0) return new Set();
		const db = await getMongoDb();
		const now = new Date();
		const ops = events.map((ev) => ({
			updateOne: {
				filter: { client_hash: ev.client_hash },
				update: { $setOnInsert: { ...ev, created_at: now } },
				upsert: true,
			},
		}));
		const res = await db.collection(RAW_LOGS_COLLECTION).bulkWrite(ops, { ordered: false });
		return new Set(Object.keys(res.upsertedIds).map(Number));
	},
	upsertDailyAggregates: async (deltas: DailyAggregatedDelta[]): Promise<void> => {
		if (deltas.length === 0) return;
		const db = await getMongoDb();
		const now = new Date();
		const ops = deltas.map((d) => ({
			updateOne: {
				filter: { date: d.date, line_item_id: d.line_item_id, venue_id: d.venue_id, screen_id: d.screen_id },
				update: {
					$inc: { impressions: d.impressions, completes: d.completes },
					$set: { updated_at: now },
					$setOnInsert: { created_at: now },
				},
				upsert: true,
			},
		}));
		await db.collection(DAILY_REPORTS_COLLECTION).bulkWrite(ops, { ordered: false });
	},
};

export const aggregateTrackingEvents = (events: RawTrackingLogEvent[]): DailyAggregatedDelta[] => {
	const buckets = new Map<string, DailyAggregatedDelta>();
	for (const ev of events) {
		const date = (ev.timestamp || '').slice(0, 10);
		if (!date || !ev.line_item_id || !ev.venue_id) continue;
		const screenId = ev.screen_id ?? 0;
		const key = `${date}:${ev.line_item_id}:${ev.venue_id}:${screenId}`;
		const bucket = buckets.get(key) ?? { date, line_item_id: ev.line_item_id, venue_id: ev.venue_id, screen_id: screenId, impressions: 0, completes: 0 };
		if (ev.event_type === 'imp') bucket.impressions += 1;
		else if (ev.event_type === 'complete') bucket.completes += 1;
		buckets.set(key, bucket);
	}
	return [...buckets.values()];
};

export class LogFlushWorker {
	private queueStore: LogFlushQueueStore;
	private mongoSink: LogFlushMongoSink;
	private intervalMs: number;
	private batchSize: number;
	private queueKey: string;
	private timer: NodeJS.Timeout | null = null;
	private indexesReady = false;
	private activeFlush: Promise<LogFlushResult> | null = null;

	constructor(options: LogFlushWorkerOptions = {}) {
		this.queueStore = options.queueStore ?? defaultRedisQueueStore;
		this.mongoSink = options.mongoSink ?? defaultMongoSink;
		this.intervalMs = options.intervalMs ?? config.worker.flushIntervalMs;
		this.batchSize = options.batchSize ?? config.worker.flushBatchSize;
		this.queueKey = options.queueKey ?? RedisKeyHelper.rawQueue();
	}

	public start(): void {
		if (this.timer) return;
		this.timer = setInterval(() => {
			void this.drainSafely();
		}, this.intervalMs);
		this.timer.unref();
		void this.drainSafely();
	}

	public async stop(): Promise<void> {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (this.activeFlush) {
			await this.activeFlush.catch(() => {});
		}
	}

	public async flushOnce(): Promise<LogFlushResult> {
		if (this.activeFlush) return this.activeFlush;
		this.activeFlush = this.runSingleBatch().finally(() => {
			this.activeFlush = null;
		});
		return this.activeFlush;
	}

	private async drainSafely(): Promise<void> {
		try {
			for (let round = 0; round < MAX_DRAIN_ROUNDS; round++) {
				const res = await this.flushOnce();
				if (res.popped < this.batchSize) break;
			}
		} catch (err: unknown) {
			if (!config.isTest) {
				console.error('[LogFlushWorker] Flush cycle failed (will retry next interval):', err instanceof Error ? err.message : err);
			}
		}
	}

	private async runSingleBatch(): Promise<LogFlushResult> {
		const rawItems = await this.queueStore.peekBatch(this.queueKey, this.batchSize);
		if (rawItems.length === 0) {
			return { popped: 0, insertedRaw: 0, skippedDuplicates: 0, aggregatedBuckets: 0 };
		}

		if (!this.indexesReady) {
			await this.mongoSink.ensureIndexes();
			this.indexesReady = true;
		}

		const parsed: RawTrackingLogEvent[] = [];
		for (const raw of rawItems) {
			try {
				const item = JSON.parse(raw) as RawTrackingLogEvent;
				if (item && item.client_hash && item.event_type && item.line_item_id && item.venue_id) {
					parsed.push(item);
				}
			} catch {
				// Skip malformed JSON entry so it cannot block the queue
			}
		}

		let insertedIndices = new Set<number>();
		let deltas: DailyAggregatedDelta[] = [];

		if (parsed.length > 0) {
			insertedIndices = await this.mongoSink.insertRawLogs(parsed);
			const newlyInserted = parsed.filter((_, idx) => insertedIndices.has(idx));
			deltas = aggregateTrackingEvents(newlyInserted);
			if (deltas.length > 0) {
				await this.mongoSink.upsertDailyAggregates(deltas);
			}
		}

		// Trim Redis queue ONLY after MongoDB writes succeed
		await this.queueStore.trimBatch(this.queueKey, rawItems.length);

		return {
			popped: rawItems.length,
			insertedRaw: insertedIndices.size,
			skippedDuplicates: parsed.length - insertedIndices.size,
			aggregatedBuckets: deltas.length,
		};
	}
}

export const defaultLogFlushWorker = new LogFlushWorker();
