import React from 'react';
import { ShopOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import VendorListPage from '../pages/VendorListPage';

export const vendorRoutes: AppRoute[] = [
	{
		path: '/admin/vendors',
		key: 'vendors',
		title: 'Media Owners',
		label: 'Media Owners',
		icon: <ShopOutlined />,
		order: 9,
		module: 'vendor',
		element: <VendorListPage />,
	},
];

export default vendorRoutes;
