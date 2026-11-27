import React from 'react';
import { PlaySquareOutlined } from '@ant-design/icons';
import type { AppRoute } from '@core/routes/types';
import SimulatorPage from '../pages/SimulatorPage';

export const simulatorRoutes: AppRoute[] = [
	{
		path: '/admin/simulator',
		key: 'simulator',
		title: 'DOOH Screen Simulator',
		label: 'Simulator',
		icon: <PlaySquareOutlined />,
		order: 35,
		module: 'simulator',
		element: <SimulatorPage />,
	},
];

export default simulatorRoutes;
