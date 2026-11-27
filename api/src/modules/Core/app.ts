import type { IncomingMessage, ServerResponse } from 'node:http';
import { Router, type MiddlewareHandler, type RouteContext } from './router/router.js';
import { sendError, sendSuccess } from './utils/httpUtil.js';
import { config } from './config/config.js';
import { checkMongoHealth, checkRedisHealth } from '@database';

export const coreRouter = new Router();

coreRouter.get('/health', async (_req, res) => {
	const [redisHealthy, mongoHealthy] = await Promise.all([checkRedisHealth(), checkMongoHealth()]);
	sendSuccess(
		res,
		{
			status: redisHealthy && mongoHealthy ? 'healthy' : 'degraded',
			uptime_seconds: Math.round(process.uptime()),
			timestamp: new Date().toISOString(),
			services: { redis: redisHealthy ? 'connected' : 'disconnected', mongo: mongoHealthy ? 'connected' : 'disconnected' },
			environment: config.nodeEnv,
		},
		'DOOH Tracking API Core is operational',
	);
});

coreRouter.get('/', (_req, res) => {
	sendSuccess(
		res,
		{
			name: 'DOOH Delivery & Tracking API',
			version: '1.0.0',
			modules: ['Core', 'Auth', 'Venue', 'Delivery', 'Log'],
		},
		'Service Online',
	);
});

const runPipeline = async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext, middlewares: MiddlewareHandler[], finalHandler: () => Promise<void>): Promise<void> => {
	let index = -1;
	const dispatch = async (i: number): Promise<void> => {
		if (i <= index) throw new Error('next() called multiple times');
		index = i;
		if (i === middlewares.length) {
			await finalHandler();
			return;
		}
		await middlewares[i](req, res, ctx, () => dispatch(i + 1));
	};
	await dispatch(0);
};

export const createApp = (mainRouter: Router = coreRouter, globalMiddlewares: MiddlewareHandler[] = []) => {
	return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
		const origin = req.headers.origin;
		if (config.allowedOrigins.includes('*')) {
			res.setHeader('Access-Control-Allow-Origin', origin || '*');
		} else if (origin && config.allowedOrigins.includes(origin)) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		}
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DOOH-API-KEY, X-DOOH-SCREEN-KEY, X-DOOH-SIGNATURE, X-DOOH-TIMESTAMP');

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

			const ctx: RouteContext = { params: matched.params, query: parsedUrl.searchParams, pathname: parsedUrl.pathname };
			const pipeline = [...globalMiddlewares, ...matched.middlewares];
			await runPipeline(req, res, ctx, pipeline, async () => {
				await matched.handler(req, res, ctx);
			});
		} catch (err: unknown) {
			if (res.headersSent) return;
			const msg = !config.isProduction && err instanceof Error ? err.message : 'Internal Server Error';
			if (config.isProduction) console.error('[DOOH API Error]', err);
			sendError(res, 500, msg);
		}
	};
};
