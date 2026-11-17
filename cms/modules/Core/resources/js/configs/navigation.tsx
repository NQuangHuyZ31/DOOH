import React from 'react';
import type { MenuProps } from 'antd';
import { DesktopOutlined, SendOutlined, PictureOutlined, PlaySquareOutlined, BarChartOutlined, FileTextOutlined } from '@ant-design/icons';
import { ROUTING_CONFIG } from './routing';

export const MAIN_MENU_ITEMS: MenuProps['items'] = [
	{
		key: ROUTING_CONFIG.modules.venues.key,
		icon: <DesktopOutlined />,
		label: ROUTING_CONFIG.modules.venues.label,
	},
	{
		key: ROUTING_CONFIG.modules.delivery.key,
		icon: <SendOutlined />,
		label: ROUTING_CONFIG.modules.delivery.label,
	},
	{
		key: ROUTING_CONFIG.modules.creatives.key,
		icon: <PictureOutlined />,
		label: ROUTING_CONFIG.modules.creatives.label,
	},
	{
		key: ROUTING_CONFIG.modules.simulator.key,
		icon: <PlaySquareOutlined />,
		label: ROUTING_CONFIG.modules.simulator.label,
	},
	{
		key: ROUTING_CONFIG.modules.reports.key,
		icon: <BarChartOutlined />,
		label: ROUTING_CONFIG.modules.reports.label,
	},
	{
		key: ROUTING_CONFIG.modules.logs.key,
		icon: <FileTextOutlined />,
		label: ROUTING_CONFIG.modules.logs.label,
	},
];
