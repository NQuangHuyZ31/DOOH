import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '@core/configs/routing';
import { MAIN_MENU_ITEMS } from '@core/configs/navigation';

const { Sider } = Layout;
const { Title } = Typography;

export interface AppSidebarProps {
	collapsed: boolean;
	onCollapse: (collapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
	const location = useLocation();
	const navigate = useNavigate();

	const selectedKey = Object.values(ROUTING_CONFIG.modules).find((m) => location.pathname.startsWith(m.path))?.key || ROUTING_CONFIG.defaultModule;

	const handleMenuClick = ({ key }: { key: string }) => {
		const targetModule = Object.values(ROUTING_CONFIG.modules).find((m) => m.key === key);
		if (targetModule) {
			navigate(targetModule.path);
		}
	};

	return (
		<Sider collapsible collapsed={collapsed} onCollapse={onCollapse} width={220}>
			<div style={{ padding: 16, textAlign: 'center' }}>
				<Title level={4} style={{ color: '#fff', margin: 0 }}>
					{collapsed ? 'DOOH' : 'DOOH CMS'}
				</Title>
			</div>
			<Menu theme="dark" selectedKeys={[selectedKey]} mode="inline" items={MAIN_MENU_ITEMS} onClick={handleMenuClick} />
		</Sider>
	);
};

export default AppSidebar;
