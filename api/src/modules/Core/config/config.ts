import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
	port: number;
	nodeEnv: string;
	appUrl: string;
	apiPrefix: string;
	appKey: string;
	screenMasterSecret: string;
	hmacMaxSkewSeconds: number;
	redis: {
		host: string;
		port: number;
		password?: string;
		db: number;
	};
	mongodb: {
		uri: string;
		dbName: string;
	};
	cms: {
		baseUrl: string;
		internalPrefix: string;
		internalSecret: string;
		timeoutMs: number;
	};
	allowedOrigins: string[];
}

export const normalizePathPrefix = (raw: string): string => (raw ? '/' + raw.replace(/^\/+|\/+$/g, '') : '');

export const config: AppConfig = {
	port: Number(process.env.PORT || 3000),
	nodeEnv: process.env.NODE_ENV || 'development',
	appUrl: (process.env.APP_URL || '').replace(/\/+$/, ''),
	apiPrefix: normalizePathPrefix(process.env.API_PREFIX || '/api/v1'),
	appKey: process.env.APP_KEY || '',
	screenMasterSecret: process.env.SCREEN_MASTER_SECRET || '',
	hmacMaxSkewSeconds: Number(process.env.HMAC_MAX_SKEW_SECONDS || 300),
	redis: {
		host: process.env.REDIS_HOST || '',
		port: Number(process.env.REDIS_PORT || 6379),
		password: process.env.REDIS_PASSWORD || undefined,
		db: Number(process.env.REDIS_DB || 0),
	},
	mongodb: {
		uri: process.env.MONGODB_URI || '',
		dbName: process.env.MONGODB_DB || '',
	},
	cms: {
		baseUrl: (process.env.CMS_BASE_URL || '').replace(/\/+$/, ''),
		internalPrefix: normalizePathPrefix(process.env.CMS_INTERNAL_PREFIX || '/admin/api/internal'),
		internalSecret: process.env.CMS_INTERNAL_SECRET || '',
		timeoutMs: Number(process.env.CMS_TIMEOUT_MS || 3000),
	},
	allowedOrigins: process.env.ALLOWED_ORIGINS
		? process.env.ALLOWED_ORIGINS.split(',')
				.map((o) => o.trim())
				.filter(Boolean)
		: [],
};
