import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteContext } from '@core/router/router.js';
import { sendError, sendNoContent } from '@core/utils/httpUtil.js';
import { LogService, defaultLogService } from '../services/logService.js';
import type { LogEventType } from '../types/log.types.js';

const resolveClientIp = (req: IncomingMessage): string => {
	const forwarded = req.headers['x-forwarded-for'];
	if (typeof forwarded === 'string' && forwarded.trim().length > 0) return forwarded;
	return req.socket.remoteAddress || '';
};

export const createLogController = (service: LogService = defaultLogService) => {
	const handleBeacon = (eventType: LogEventType) => async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const hash = ctx.params.hash || '';
		const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';

		const status = await service.ingestBeacon({ eventType, hash, ip: resolveClientIp(req), userAgent });
		if (status === 'invalid_or_expired') {
			sendError(res, 404, 'Tracking link is invalid or expired');
			return;
		}
		sendNoContent(res);
	};

	return {
		recordImpression: handleBeacon('imp'),
		recordComplete: handleBeacon('complete'),
	};
};
