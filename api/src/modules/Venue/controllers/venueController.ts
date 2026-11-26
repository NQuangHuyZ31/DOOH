import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteContext } from '@core/router/router.js';
import { readJsonBody, sendError, sendSuccess } from '@core/utils/httpUtil.js';
import type { AuthContext } from '@modules/Auth/types/auth.types.js';
import type { HeartbeatPayload, PartnerScreenPayload } from '../types/venue.types.js';
import { VenueService, defaultVenueService } from '../services/venueService.js';

const parseBodyOrRespond = async <T>(req: IncomingMessage, res: ServerResponse): Promise<T | null> => {
	try {
		return await readJsonBody<T>(req);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Invalid JSON request body';
		const status = message.startsWith('PAYLOAD_TOO_LARGE') ? 413 : 400;
		sendError(res, status, message);
		return null;
	}
};

export const createVenueController = (service: VenueService = defaultVenueService) => ({
	registerScreen: async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = ctx.auth as AuthContext | undefined;
		if (!auth) {
			sendError(res, 401, 'Unauthorized');
			return;
		}

		const body = await parseBodyOrRespond<Partial<PartnerScreenPayload>>(req, res);
		if (!body) return;

		const result = await service.registerScreen(auth, body);
		if (!result.ok) {
			sendError(res, result.code, result.message, result.errors);
			return;
		}

		sendSuccess(res, result.data, 'Screen registered', result.status);
	},

	registerScreensBatch: async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = ctx.auth as AuthContext | undefined;
		if (!auth) {
			sendError(res, 401, 'Unauthorized');
			return;
		}

		const body = await parseBodyOrRespond<{ screens?: unknown }>(req, res);
		if (!body) return;

		const result = await service.registerScreensBatch(auth, body.screens);
		if (!result.ok) {
			sendError(res, result.code, result.message, result.errors);
			return;
		}

		sendSuccess(res, result.data, 'Batch screen registration completed', result.status);
	},

	listScreens: async (_req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = ctx.auth as AuthContext | undefined;
		if (!auth) {
			sendError(res, 401, 'Unauthorized');
			return;
		}

		const result = await service.listScreens(auth);
		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}

		sendSuccess(res, result.data, 'Screens retrieved', result.status);
	},

	getScreenConfig: async (_req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = ctx.auth as AuthContext | undefined;
		if (!auth) {
			sendError(res, 401, 'Unauthorized');
			return;
		}

		const result = await service.getScreenConfig(auth, ctx.params.code || '');
		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}

		sendSuccess(res, result.data, 'Screen config retrieved', result.status);
	},

	recordHeartbeat: async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = ctx.auth as AuthContext | undefined;
		if (!auth) {
			sendError(res, 401, 'Unauthorized');
			return;
		}

		const body = await parseBodyOrRespond<HeartbeatPayload>(req, res);
		if (!body) return;

		const ipAddress = body.ip_address || (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress;
		const result = await service.recordHeartbeat(auth, ctx.params.code || '', { ...body, ip_address: ipAddress });
		if (!result.ok) {
			sendError(res, result.code, result.message, result.errors);
			return;
		}

		sendSuccess(res, result.data, 'Heartbeat recorded', result.status);
	},
});
