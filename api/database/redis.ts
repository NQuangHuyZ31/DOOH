import { Redis } from 'ioredis';
import { config } from '../src/modules/Core/config/config.js';

let redisInstance: Redis | null = null;

export const RedisKeyHelper = {
	playlist: (venueId: string | number): string => `playlist:venue:${venueId}`,
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

export const checkRedisHealth = async (): Promise<boolean> => {
	try {
		const client = getRedisClient();
		if (client.status === 'wait') {
			await client.connect().catch(() => {});
		}
		if (client.status !== 'ready') return false;
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
