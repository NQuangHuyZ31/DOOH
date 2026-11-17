import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import {
  DesktopOutlined,
  SendOutlined,
  PictureOutlined,
  BarChartOutlined,
  FileTextOutlined,
  PlaySquareOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
  activeKey?: string;
  onNavigate?: (key: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeKey = 'venues', onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: 'venues', icon: <DesktopOutlined />, label: 'Venues (Screens)' },
    { key: 'delivery', icon: <SendOutlined />, label: 'Delivery (Campaigns)' },
    { key: 'creatives', icon: <PictureOutlined />, label: 'Creative Hub' },
    { key: 'simulator', icon: <PlaySquareOutlined />, label: 'Screen Simulator' },
    { key: 'reports', icon: <BarChartOutlined />, label: 'Reports & Analytics' },
    { key: 'logs', icon: <FileTextOutlined />, label: 'Tracking Logs' },
  ];

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
          selectedKeys={[activeKey]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => onNavigate?.(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>DOOH Media Management Platform</Text>
          <Space>
            <Text type="secondary">Admin</Text>
            <Button type="text" icon={<LogoutOutlined />}>Logout</Button>
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
