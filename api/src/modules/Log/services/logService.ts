import crypto from 'node:crypto';
import { getRedisClient, RedisKeyHelper } from '@database';
import { config } from '@core/config/config.js';
import { decryptToken } from '@core/utils/tokenCrypto.js';
import type { AtomicBeaconRecordParams, BeaconIngestInput, BeaconIngestStatus, LogBeaconStore, RawTrackingLogEvent } from '../types/log.types.js';

// Atomic Redis Lua script: dedup -> cap:daily (imp only) -> stat hash -> raw log queue
const INGEST_BEACON_LUA = `
local isNew = redis.call('SET', KEYS[1], '1', 'EX', tonumber(ARGV[2]), 'NX')
if not isNew then
	return 0
end
if ARGV[1] == 'imp' then
	local capCount = redis.call('INCR', KEYS[2])
	if capCount == 1 then
		redis.call('EXPIRE', KEYS[2], tonumber(ARGV[3]))
	end
end
local statCount = redis.call('HINCRBY', KEYS[3], ARGV[1], 1)
if statCount == 1 then
	redis.call('EXPIRE', KEYS[3], tonumber(ARGV[3]))
end
redis.call('RPUSH', KEYS[4], ARGV[4])
return 1
`;

export interface LogServiceOptions {
	store?: LogBeaconStore;
	appKey?: string;
	dedupTtlSeconds?: number;
	statTtlSeconds?: number;
	nowProvider?: () => Date;
}

const defaultRedisBeaconStore: LogBeaconStore = {
	recordAtomic: async (params: AtomicBeaconRecordParams): Promise<boolean> => {
		try {
			const client = getRedisClient();
			if (client.status === 'wait' || client.status === 'close') {
				await client.connect().catch(() => {});
			}
			if (client.status !== 'ready') return false;

			const res = await client.eval(
				INGEST_BEACON_LUA,
				4,
				params.dedupKey,
				params.capKey,
				params.statKey,
				params.queueKey,
				params.eventType,
				String(params.dedupTtlSeconds),
				String(params.statTtlSeconds),
				params.rawPayload,
			);
			return Number(res) === 1;
		} catch (err: unknown) {
			if (!config.isTest) {
				console.error('[LogService] Redis beacon ingest failed:', err instanceof Error ? err.message : err);
			}
			return false;
		}
	},
};

export const maskIp = (rawIp: string): string => {
	const cleaned = rawIp.split(',')[0]?.trim().replace(/^::ffff:/, '') || '';
	if (!cleaned) return '';
	if (cleaned.includes('.')) {
		const parts = cleaned.split('.');
		return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : cleaned;
	}
	const v6Parts = cleaned.split(':');
	return v6Parts.length > 2 ? `${v6Parts.slice(0, 3).join(':')}::` : cleaned;
};

export class LogService {
	private store: LogBeaconStore;
	private appKey?: string;
	private dedupTtlSeconds: number;
	private statTtlSeconds: number;
	private nowProvider: () => Date;

	constructor(options: LogServiceOptions = {}) {
		this.store = options.store ?? defaultRedisBeaconStore;
		this.appKey = options.appKey;
		this.dedupTtlSeconds = options.dedupTtlSeconds ?? config.cache.dedupTtlSeconds;
		this.statTtlSeconds = options.statTtlSeconds ?? config.cache.statTtlSeconds;
		this.nowProvider = options.nowProvider ?? (() => new Date());
	}

	public async ingestBeacon(input: BeaconIngestInput): Promise<BeaconIngestStatus> {
		if (!input.hash || input.hash.length < 28) return 'invalid_or_expired';

		const payload = decryptToken(input.hash, this.appKey);
		if (!payload) return 'invalid_or_expired';

		const venueId = Number(payload.venue_id);
		const lineItemId = Number(payload.line_item_id);
		if (!Number.isInteger(venueId) || venueId <= 0 || !Number.isInteger(lineItemId) || lineItemId <= 0) {
			return 'invalid_or_expired';
		}

		const screenId = typeof payload.screen_id === 'number' && payload.screen_id > 0 ? payload.screen_id : 0;
		const now = this.nowProvider();
		const epochMs = now.getTime();
		const today = now.toISOString().slice(0, 10);
		const bucket = Math.floor(epochMs / (Math.max(1, this.dedupTtlSeconds) * 1000));
		const clientHash = crypto.createHash('sha256').update(`${input.eventType}:${input.hash}:${bucket}`, 'utf8').digest('hex');

		const event: RawTrackingLogEvent = {
			event_type: input.eventType,
			venue_id: venueId,
			screen_id: screenId > 0 ? screenId : undefined,
			line_item_id: lineItemId,
			creative_id: typeof payload.creative_id === 'number' ? payload.creative_id : undefined,
			timestamp: now.toISOString(),
			epoch_ms: epochMs,
			client_hash: clientHash,
			ip: maskIp(input.ip),
			user_agent: input.userAgent.slice(0, 255),
		};

		const recorded = await this.store.recordAtomic({
			dedupKey: RedisKeyHelper.dedup(input.eventType, input.hash),
			capKey: RedisKeyHelper.capDaily(today, lineItemId),
			statKey: RedisKeyHelper.stat(today, lineItemId, venueId, screenId),
			queueKey: RedisKeyHelper.rawQueue(),
			eventType: input.eventType,
			dedupTtlSeconds: this.dedupTtlSeconds,
			statTtlSeconds: this.statTtlSeconds,
			rawPayload: JSON.stringify(event),
		});

		return recorded ? 'recorded' : 'duplicate';
	}
}

export const defaultLogService = new LogService();
