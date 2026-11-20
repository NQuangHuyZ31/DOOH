import React from 'react';
import { VideoCameraOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import CreativeListPage from '../pages/CreativeListPage';

export const creativeRoutes: AppRoute[] = [
	{
		path: '/admin/creatives',
		key: 'creatives',
		title: 'Creative Assets',
		label: 'Creatives',
		icon: <VideoCameraOutlined />,
		order: 20,
		module: 'creative',
		element: <CreativeListPage />,
	},
];

export default creativeRoutes;
