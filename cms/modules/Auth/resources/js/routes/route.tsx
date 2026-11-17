import React from 'react';
import type { AppRoute } from '@core/routes/types';
import { ROUTING_CONFIG } from '@core/configs/routing';
import LoginPage from '../pages/LoginPage';

export const authRoutes: AppRoute[] = [
  {
    path: ROUTING_CONFIG.auth.loginPath,
    key: 'auth-login',
    title: 'Login',
    element: <LoginPage />,
    layout: 'guest',
  },
];

export default authRoutes;
