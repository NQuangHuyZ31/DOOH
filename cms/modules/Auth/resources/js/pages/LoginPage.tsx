import React, { useState } from 'react';
import { Row, Col, Typography, Space, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '@core';
import { authApi } from '../Action/authApi';
import { LoginForm } from '../components/LoginForm';
import { LoginShowcase } from '../components/LoginShowcase';
import type { LoginPayload } from '../types/auth';

const { Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginPayload) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      const token = res.data?.data?.token || 'mock_token';
      localStorage.setItem(ROUTING_CONFIG.auth.tokenKey, token);
      message.success('Authentication verified. Redirecting to console...');
      navigate(ROUTING_CONFIG.defaultPath, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Invalid credentials or server unavailable.';
      message.error(errorMsg || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row style={{ minHeight: '100vh', background: '#ffffff', overflow: 'hidden' }}>
      <Col xs={0} lg={11} xl={10} style={{ height: '100vh', position: 'sticky', top: 0 }}>
        <LoginShowcase />
      </Col>

      <Col
        xs={24}
        lg={13}
        xl={14}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '40px 24px',
          minHeight: '100vh',
          background: '#ffffff',
        }}
      >
        <div style={{ width: '100%', height: 40 }} />

        <LoginForm loading={loading} onSubmit={handleLogin} />

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Space size={8}>
            <LockOutlined style={{ color: '#10b981', fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              SOC2 Type II Certified • 256-bit TLS Encryption
            </Text>
          </Space>
          <div style={{ marginTop: 6 }}>
            <Text type="secondary" style={{ fontSize: 11, color: '#94a3b8' }}>
              © 2026 DOOH Media Platform. All rights reserved.
            </Text>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default LoginPage;
