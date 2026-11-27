import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteContext } from '@core/router/router.js';
import { extractClientIp, sendError, sendNoContent } from '@core/utils/httpUtil.js';
import { LogService, defaultLogService } from '../services/logService.js';
import type { LogEventType } from '../types/log.types.js';

export const createLogController = (service: LogService = defaultLogService) => {
	const handleBeacon = (eventType: LogEventType) => async (req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const hash = ctx.params.hash || '';
		const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';

		const status = await service.ingestBeacon({ eventType, hash, ip: extractClientIp(req), userAgent });
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
