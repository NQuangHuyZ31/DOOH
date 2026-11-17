import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DesktopOutlined,
  SendOutlined,
  PictureOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PlaySquareOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { ROUTING_CONFIG } from '../configs/routing';
import { http } from '../Action/api';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentKey = Object.values(ROUTING_CONFIG.modules).find(
    (m) => location.pathname.startsWith(m.path)
  )?.key || ROUTING_CONFIG.defaultModule;

  const menuItems = [
    { key: ROUTING_CONFIG.modules.venues.key, icon: <DesktopOutlined />, label: ROUTING_CONFIG.modules.venues.label },
    { key: ROUTING_CONFIG.modules.delivery.key, icon: <SendOutlined />, label: ROUTING_CONFIG.modules.delivery.label },
    { key: ROUTING_CONFIG.modules.creatives.key, icon: <PictureOutlined />, label: ROUTING_CONFIG.modules.creatives.label },
    { key: ROUTING_CONFIG.modules.simulator.key, icon: <PlaySquareOutlined />, label: ROUTING_CONFIG.modules.simulator.label },
    { key: ROUTING_CONFIG.modules.reports.key, icon: <BarChartOutlined />, label: ROUTING_CONFIG.modules.reports.label },
    { key: ROUTING_CONFIG.modules.logs.key, icon: <FileTextOutlined />, label: ROUTING_CONFIG.modules.logs.label },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    const targetModule = Object.values(ROUTING_CONFIG.modules).find((m) => m.key === key);
    if (targetModule) {
      navigate(targetModule.path);
    }
  };

  const handleLogout = async () => {
    try {
      await http.post('/auth/logout');
    } catch {
      // Silently handle error if session already revoked
    } finally {
      localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
      navigate(ROUTING_CONFIG.auth.loginPath, { replace: true });
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(val) => setCollapsed(val)} width={220}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'DOOH' : 'DOOH CMS'}
          </Title>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[currentKey]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>DOOH Media Management Platform</Text>
          <Space>
            <Text type="secondary">Admin</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
