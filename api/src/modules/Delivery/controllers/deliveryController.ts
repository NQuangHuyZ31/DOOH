import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteContext } from '@core/router/router.js';
import { getAuthContext, sendError, sendSuccess } from '@core/utils/httpUtil.js';
import type { AuthContext } from '@modules/Auth/types/auth.types.js';
import { DeliveryService, defaultDeliveryService } from '../services/deliveryService.js';

export const createDeliveryController = (service: DeliveryService = defaultDeliveryService) => ({
	getPlaylist: async (_req: IncomingMessage, res: ServerResponse, ctx: RouteContext): Promise<void> => {
		const auth = getAuthContext<AuthContext>(ctx, res);
		if (!auth) return;

		const result = await service.getPlaylist(auth, { screenCode: ctx.query.get('screen_code') });

		if (!result.ok) {
			sendError(res, result.code, result.message);
			return;
		}

		sendSuccess(res, result.data, 'Playlist retrieved');
	},
});
