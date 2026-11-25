import { Router } from '#core/router/router.js';
import { createDeliveryController } from './controllers/deliveryController.js';
import { DeliveryService, defaultDeliveryService } from './services/deliveryService.js';

export const createDeliveryRouter = (service: DeliveryService = defaultDeliveryService): Router => {
	const router = new Router();
	const controller = createDeliveryController(service);

	router.get('/playlist', controller.getPlaylist);

	return router;
};
