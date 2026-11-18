import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import UserListPage from '../pages/UserListPage';

export const userRoutes: AppRoute[] = [
	{
		path: '/admin/user',
		key: 'user',
		title: 'User Management',
		label: 'Users',
		icon: <UserOutlined />,
		order: 20,
		module: 'user',
		layout: 'main',
		element: <UserListPage />,
	},
	{
		path: '/admin/user/role',
		key: 'role',
		title: 'Role',
		label: 'Roles & Permissions',
		layout: 'main',
		module: 'user',
		action: 'roles',
		parentPath: '/admin/user',
		element: <UserListPage />,
	},
];

export default userRoutes;
