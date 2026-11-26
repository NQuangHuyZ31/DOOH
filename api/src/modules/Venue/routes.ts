import { Router } from '@core/router/router.js';
import { createVenueController } from './controllers/venueController.js';
import { VenueService, defaultVenueService } from './services/venueService.js';

export const createVenueRouter = (service: VenueService = defaultVenueService): Router => {
	const router = new Router();
	const controller = createVenueController(service);

	router.post('/screens', controller.registerScreen);
	router.post('/screens/batch', controller.registerScreensBatch);
	router.get('/screens', controller.listScreens);
	router.get('/screens/:code/config', controller.getScreenConfig);
	router.post('/screens/:code/heartbeat', controller.recordHeartbeat);

	return router;
};
