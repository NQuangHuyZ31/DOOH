import { Redis } from 'ioredis';
import { config } from '@core/config/config.js';

let redisInstance: Redis | null = null;

export interface CacheStore {
	get(key: string): Promise<string | null>;
	mget?(keys: string[]): Promise<(string | null)[]>;
	setex?(key: string, ttlSeconds: number, value: string): Promise<void>;
}

export const RedisKeyHelper = {
	playlist: (venueId: string | number): string => `playlist:venue:${venueId}`,
	playlistScreen: (screenId: string | number): string => `playlist:screen:${screenId}`,
	capDaily: (date: string, lineItemId: string | number): string => `cap:daily:${date}:${lineItemId}`,
	vendorAuth: (keyHash: string): string => `vendor:auth:${keyHash}`,
	screenAuth: (screenCode: string): string => `screen:auth:${screenCode}`,
	dedup: (eventType: string, hash: string): string => `dedup:${eventType}:${hash}`,
	stat: (date: string, lineItemId: string | number, venueId: string | number, screenId: string | number = 0): string => `stat:${date}:${lineItemId}:${venueId}:${screenId}`,
	rawQueue: (): string => 'queue:raw_tracking_logs',
};

export const getRedisClient = (): Redis => {
	if (!redisInstance || redisInstance.status === 'end') {
		redisInstance = new Redis({
			host: config.redis.host,
			port: config.redis.port,
			username: config.redis.username,
			password: config.redis.password,
			db: config.redis.db,
			lazyConnect: true,
			enableOfflineQueue: false,
			maxRetriesPerRequest: config.isTest ? 0 : 1,
			connectTimeout: config.redis.connectTimeoutMs,
			retryStrategy: config.isTest ? () => null : (times: number) => Math.min(times * 200, 3000),
		});

		redisInstance.on('error', () => {
			// Suppress unhandled event error when offline
		});
	}

	return redisInstance;
};

export const getReadyRedis = async (): Promise<Redis | null> => {
	const client = getRedisClient();
	if (client.status === 'wait' || client.status === 'close') {
		await client.connect().catch(() => {});
	}
	return client.status === 'ready' ? client : null;
};

export const defaultCacheStore: CacheStore = {
	get: async (key: string): Promise<string | null> => {
		const client = await getReadyRedis();
		return client ? client.get(key) : null;
	},
	mget: async (keys: string[]): Promise<(string | null)[]> => {
		if (keys.length === 0) return [];
		const client = await getReadyRedis();
		return client ? client.mget(...keys) : keys.map(() => null);
	},
	setex: async (key: string, ttlSeconds: number, value: string): Promise<void> => {
		const client = await getReadyRedis();
		if (!client) return;
		await client.setex(key, ttlSeconds, value).catch((err: unknown) => {
			if (!config.isTest) {
				console.error(`[Redis] SETEX failed for ${key}:`, err instanceof Error ? err.message : err);
			}
		});
	},
};

export const readCacheJson = async <T>(store: CacheStore, key: string): Promise<T | null> => {
	try {
		const raw = await store.get(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
};

export const writeCacheJson = async (store: CacheStore, key: string, ttlSeconds: number, value: unknown): Promise<void> => {
	if (!store.setex) return;
	try {
		await store.setex(key, ttlSeconds, JSON.stringify(value));
	} catch {
		// Non-blocking cache write failure
	}
};

export const checkRedisHealth = async (): Promise<boolean> => {
	try {
		const client = await getReadyRedis();
		if (!client) return false;
		const pong = await client.ping();
		return pong === 'PONG';
	} catch {
		return false;
	}
};

export const closeRedisConnection = async (): Promise<void> => {
	if (redisInstance) {
		await redisInstance.quit().catch(() => redisInstance?.disconnect());
		redisInstance = null;
	}
};
