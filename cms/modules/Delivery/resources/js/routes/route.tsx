import React from 'react';
import { FieldTimeOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import DeliveryDashboardPage from '../pages/DeliveryDashboardPage';

export const deliveryRoutes: AppRoute[] = [
	{
		path: '/admin/delivery',
		key: 'delivery',
		title: 'Ad Delivery & Pacing',
		label: 'Delivery',
		icon: <FieldTimeOutlined />,
		order: 25,
		module: 'delivery',
		element: <DeliveryDashboardPage />,
	},
];

export default deliveryRoutes;
