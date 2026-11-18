import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMenuRoutes } from '@core/routes/registry';
import { buildSidebarMenuItems, resolveActiveMenuKeys } from './sidebarMenuBuilder';

const { Sider } = Layout;
const { Title } = Typography;

const SUBMENU_ACTIVE_STYLE = `
	.ant-menu-dark .ant-menu-submenu.ant-menu-submenu-title-selected > .ant-menu-submenu-title {
		background-color: #1677ff !important;
		color: #ffffff !important;
	}
	.ant-menu-dark .ant-menu-submenu.ant-menu-submenu-title-selected > .ant-menu-submenu-title:hover {
		background-color: #4096ff !important;
	}
`;

export interface AppSidebarProps {
	collapsed: boolean;
	onCollapse: (collapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const menuRoutes = useMenuRoutes();

	const handleNavigate = useCallback(
		(path: string) => {
			if (path.startsWith('/') && location.pathname !== path) {
				navigate(path);
			}
		},
		[location.pathname, navigate],
	);

	const menuItems = useMemo(() => buildSidebarMenuItems(menuRoutes, handleNavigate, location.pathname), [menuRoutes, handleNavigate, location.pathname]);
	const { selectedKeys, defaultOpenKeys } = useMemo(() => resolveActiveMenuKeys(menuRoutes, location.pathname), [menuRoutes, location.pathname]);

	const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys);

	useEffect(() => {
		if (!collapsed && defaultOpenKeys.length > 0) {
			setOpenKeys((prev) => Array.from(new Set([...prev, ...defaultOpenKeys])));
		}
	}, [collapsed, defaultOpenKeys]);

	const handleMenuClick = ({ key }: { key: string }) => {
		handleNavigate(key);
	};

	return (
		<Sider collapsible collapsed={collapsed} onCollapse={onCollapse} width={220}>
			<style>{SUBMENU_ACTIVE_STYLE}</style>
			<div style={{ padding: 16, textAlign: 'center' }}>
				<Title level={4} style={{ color: '#fff', margin: 0 }}>
					{collapsed ? 'DOOH' : 'DOOH CMS'}
				</Title>
			</div>
			<Menu theme="dark" mode="inline" selectedKeys={selectedKeys} openKeys={collapsed ? undefined : openKeys} onOpenChange={setOpenKeys} items={menuItems} onClick={handleMenuClick} />
		</Sider>
	);
};

export default AppSidebar;
