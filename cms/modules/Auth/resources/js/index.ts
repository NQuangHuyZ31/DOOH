import { registerRoutes } from '@core';
import { authRoutes } from './routes/route';
import authReducer, { setCredentials, clearAuth, setInitialized } from './store/authSlice';
import { fetchMe, logout } from './store/authThunk';

registerRoutes(authRoutes);

export { authRoutes, authReducer, fetchMe, logout, setCredentials, clearAuth, setInitialized };
