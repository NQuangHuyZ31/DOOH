import { Router } from '@core/router/router.js';
import { createLogController } from './controllers/logController.js';
import { LogService, defaultLogService } from './services/logService.js';

export const createLogRouter = (service: LogService = defaultLogService): Router => {
	const router = new Router();
	const controller = createLogController(service);

	router.get('/imp/:hash', controller.recordImpression);
	router.get('/complete/:hash', controller.recordComplete);

	return router;
};
