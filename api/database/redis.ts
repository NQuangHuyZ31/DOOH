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
	dedup: (hash: string): string => `dedup:${hash}`,
	stat: (date: string, lineItemId: string | number, venueId: string | number): string => `stat:${date}:${lineItemId}:${venueId}`,
	rawQueue: (): string => 'queue:raw_tracking_logs',
};

export const getRedisClient = (): Redis => {
	if (!redisInstance) {
		redisInstance = new Redis({
			host: config.redis.host,
			port: config.redis.port,
			password: config.redis.password,
			db: config.redis.db,
			lazyConnect: true,
			enableOfflineQueue: false,
			maxRetriesPerRequest: 0,
			connectTimeout: 1000,
			retryStrategy: () => null,
		});

		redisInstance.on('error', () => {
			// Suppress unhandled event error when offline
		});
	}

	return redisInstance;
};

const getReadyRedis = async (): Promise<Redis | null> => {
	const client = getRedisClient();
	if (client.status === 'wait') await client.connect().catch(() => {});
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
		if (client) await client.setex(key, ttlSeconds, value).catch(() => {});
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
