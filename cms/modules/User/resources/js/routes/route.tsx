import React from 'react';
import { KeyOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import RoleListPage from '../pages/RoleListPage';
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
		label: 'Roles',
		icon: <SettingOutlined />,
		layout: 'main',
		module: 'user',
		action: 'roles',
		parentPath: '/admin/user',
		element: <RoleListPage />,
	},
	{
		path: '/admin/user/permission',
		key: 'permission',
		title: 'Permission',
		label: 'Permissions',
		icon: <KeyOutlined />,
		layout: 'main',
		module: 'user',
		action: 'permissions',
		parentPath: '/admin/user',
		element: <UserListPage />,
	},
];

export default userRoutes;
