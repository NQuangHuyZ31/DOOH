export type LogEventType = 'imp' | 'complete';

export type BeaconIngestStatus = 'recorded' | 'duplicate' | 'invalid_or_expired';

export interface RawTrackingLogEvent {
	event_type: LogEventType;
	venue_id: number;
	screen_id?: number;
	line_item_id: number;
	creative_id?: number;
	timestamp: string;
	epoch_ms: number;
	client_hash: string;
	ip: string;
	user_agent: string;
}

export interface BeaconIngestInput {
	eventType: LogEventType;
	hash: string;
	ip: string;
	userAgent: string;
}

export interface AtomicBeaconRecordParams {
	dedupKey: string;
	capKey: string;
	statKey: string;
	queueKey: string;
	eventType: LogEventType;
	dedupTtlSeconds: number;
	statTtlSeconds: number;
	rawPayload: string;
}

export interface LogBeaconStore {
	recordAtomic(params: AtomicBeaconRecordParams): Promise<boolean>;
}

export interface DailyAggregatedDelta {
	date: string;
	line_item_id: number;
	venue_id: number;
	screen_id: number;
	impressions: number;
	completes: number;
}

export interface LogFlushResult {
	popped: number;
	insertedRaw: number;
	skippedDuplicates: number;
	aggregatedBuckets: number;
}

export interface LogFlushQueueStore {
	peekBatch(queueKey: string, count: number): Promise<string[]>;
	trimBatch(queueKey: string, count: number): Promise<void>;
}

export interface LogFlushMongoSink {
	ensureIndexes(): Promise<void>;
	insertRawLogs(events: RawTrackingLogEvent[]): Promise<Set<number>>;
	upsertDailyAggregates(deltas: DailyAggregatedDelta[]): Promise<void>;
}
