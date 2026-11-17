import { registerRoutes } from '@core';
import { authRoutes } from './routes/route';

registerRoutes(authRoutes);

export { authRoutes };
