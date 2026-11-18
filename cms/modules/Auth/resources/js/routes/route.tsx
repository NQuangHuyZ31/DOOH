import React from 'react';
import type { AppRoute } from '@core/routes/types';
import LoginPage from '../pages/LoginPage';

export const authRoutes: AppRoute[] = [
  {
    path: '/admin/login',
    key: 'auth-login',
    title: 'Login',
    element: <LoginPage />,
    layout: 'guest',
  },
];

export default authRoutes;
