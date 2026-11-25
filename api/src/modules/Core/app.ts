import type { IncomingMessage, ServerResponse } from 'node:http';
import { Router } from './router/router.js';
import { sendError, sendSuccess } from './utils/httpUtil.js';
import { config } from './config/config.js';
import { checkRedisHealth } from '../../../database/index.js';

export const coreRouter = new Router();

coreRouter.get('/health', async (_req, res) => {
	const redisHealthy = await checkRedisHealth();
	sendSuccess(res, {
		status: 'healthy',
		uptime_seconds: Math.round(process.uptime()),
		timestamp: new Date().toISOString(),
		services: {
			redis: redisHealthy ? 'connected' : 'disconnected',
		},
		environment: config.nodeEnv,
	}, 'DOOH Tracking API Core is operational');
});

coreRouter.get('/', (_req, res) => {
	sendSuccess(res, {
		name: 'DOOH Delivery & Tracking API',
		version: '1.0.0',
		modules: ['Core', 'Venue', 'Delivery', 'Log'],
	}, 'Service Online');
});

export const createApp = (mainRouter: Router = coreRouter) => {
	return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
		const origin = req.headers.origin || '*';
		const isAllowed = config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin);

		res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : 'null');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DOOH-API-KEY');

		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		try {
			const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
			const matched = mainRouter.match(req.method || 'GET', parsedUrl.pathname);

			if (!matched) {
				sendError(res, 404, `Endpoint ${req.method} ${parsedUrl.pathname} not found`);
				return;
			}

			await matched.handler(req, res, { params: matched.params, query: parsedUrl.searchParams });
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Internal Server Error';
			sendError(res, 500, msg);
		}
	};
};
