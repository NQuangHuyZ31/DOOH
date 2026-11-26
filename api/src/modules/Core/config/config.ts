import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
	port: number;
	nodeEnv: string;
	isProduction: boolean;
	isTest: boolean;
	appUrl: string;
	apiPrefix: string;
	appKey: string;
	screenMasterSecret: string;
	hmacMaxSkewSeconds: number;
	redis: {
		host: string;
		port: number;
		username?: string;
		password?: string;
		db: number;
		connectTimeoutMs: number;
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
	cache: {
		authTtlSeconds: number;
		playlistTtlSeconds: number;
		playlistDefaultRefreshSeconds: number;
		tokenGraceSeconds: number;
	};
	allowedOrigins: string[];
}

export const normalizePathPrefix = (raw: string): string => (raw ? '/' + raw.replace(/^\/+|\/+$/g, '') : '');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test' || process.execArgv.includes('--test');

export const config: AppConfig = {
	port: Number(process.env.PORT || 3000),
	nodeEnv,
	isProduction,
	isTest,
	appUrl: (process.env.APP_URL || '').replace(/\/+$/, ''),
	apiPrefix: normalizePathPrefix(process.env.API_PREFIX || '/api/v1'),
	appKey: process.env.APP_KEY || '',
	screenMasterSecret: process.env.SCREEN_MASTER_SECRET || '',
	hmacMaxSkewSeconds: Number(process.env.HMAC_MAX_SKEW_SECONDS || 300),
	redis: {
		host: process.env.REDIS_HOST || '',
		port: Number(process.env.REDIS_PORT || 6379),
		username: process.env.REDIS_USERNAME || undefined,
		password: process.env.REDIS_PASSWORD || undefined,
		db: Number(process.env.REDIS_DB || 0),
		connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000),
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
	cache: {
		authTtlSeconds: Number(process.env.AUTH_CACHE_TTL_SECONDS || (isProduction ? 600 : 300)),
		playlistTtlSeconds: Number(process.env.PLAYLIST_CACHE_TTL_SECONDS || (isProduction ? 1800 : 120)),
		playlistDefaultRefreshSeconds: Number(process.env.PLAYLIST_DEFAULT_REFRESH_SECONDS || 120),
		tokenGraceSeconds: Number(process.env.TOKEN_GRACE_SECONDS || 300),
	},
	allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean) : [],
};

export const assertProductionConfig = (cfg: AppConfig = config): void => {
	if (!cfg.isProduction) return;

	const required: [string, string][] = [
		['APP_KEY', cfg.appKey],
		['SCREEN_MASTER_SECRET', cfg.screenMasterSecret],
		['REDIS_HOST', cfg.redis.host],
		['CMS_BASE_URL', cfg.cms.baseUrl],
		['CMS_INTERNAL_SECRET', cfg.cms.internalSecret],
	];

	const missing = required.filter(([, val]) => !val).map(([name]) => name);
	if (missing.length > 0) {
		throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
	}
};
