import React from 'react';
import type { AppRoute } from '@core/routes/types';

export const userRoutes: AppRoute[] = [
	{
		path: '/admin/user',
		key: 'user',
		title: 'User',
		element: <></>,
		layout: 'main',
	},
	{
		path: '/admin/user/role',
		key: 'role',
		title: 'Role',
		element: <></>,
		layout: 'main',
		parentPath: '/admin/user',
	},
];

export default userRoutes;
