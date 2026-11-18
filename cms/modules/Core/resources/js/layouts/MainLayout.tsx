import React, { useState } from 'react';
import { Layout } from 'antd';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';

const { Content } = Layout;

export interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<Layout style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
			<AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
			<Layout style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
				<AppHeader />
				<Content
					style={{
						margin: 0,
						padding: 24,
						background: '#f5f5f5',
						flex: 1,
						overflowY: 'auto',
						overflowX: 'hidden',
					}}
				>
					{children}
				</Content>
			</Layout>
		</Layout>
	);
};

export default MainLayout;
