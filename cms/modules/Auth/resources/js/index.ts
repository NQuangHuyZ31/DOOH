import { registerRoutes } from '@core';
import { authRoutes } from './routes/route';
import authReducer from './store/authSlice';

registerRoutes(authRoutes);

export { authRoutes, authReducer };
