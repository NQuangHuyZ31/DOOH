import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
	port: number;
	nodeEnv: string;
	apiPrefix: string;
	appKey: string;
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
	allowedOrigins: string[];
}

export const config: AppConfig = {
	port: Number(process.env.PORT || 3000),
	nodeEnv: process.env.NODE_ENV || 'development',
	apiPrefix: process.env.API_PREFIX || '/api/v1',
	appKey: process.env.APP_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	redis: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: Number(process.env.REDIS_PORT || 6379),
		password: process.env.REDIS_PASSWORD || undefined,
		db: Number(process.env.REDIS_DB || 0),
	},
	mongodb: {
		uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dooh_tracking',
		dbName: process.env.MONGODB_DB || 'dooh_tracking',
	},
	allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim()),
};
