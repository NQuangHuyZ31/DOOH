import React, { useState } from 'react';
import { Card, Typography, theme, Alert } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '@core';
import { authApi } from '../Action/authApi';
import { LoginForm } from '../components/LoginForm';
import { LoginHeroBanner } from '../components/LoginHeroBanner';
import type { LoginPayload } from '../types/auth';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { token: antdTheme } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(values);
      const token = res.data?.data?.token || 'mock_token';
      localStorage.setItem(ROUTING_CONFIG.auth.tokenKey, token);
      navigate(ROUTING_CONFIG.defaultPath, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Invalid credentials or server unavailable.';
      setError(errorMsg || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, #0b1120 0%, #030712 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 960,
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', minHeight: 560 }}>
          <div style={{ width: '48%', display: 'flex' }}>
            <LoginHeroBanner />
          </div>

          <div
            style={{
              flex: 1,
              padding: '40px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: '#ffffff',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${antdTheme.colorPrimary}18`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <DesktopOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />
              </div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: antdTheme.colorPrimary }}>
                Sign In
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Enter your credentials to access DOOH CMS
              </Text>
            </div>

            {error && (
              <Alert
                type="error"
                showIcon
                message={error}
                style={{ marginBottom: 16, borderRadius: 8 }}
                closable
                onClose={() => setError(null)}
              />
            )}

            <LoginForm
              loading={loading}
              onSubmit={handleLogin}
              onForgotPassword={() => {}}
              onGoogleLogin={() => {}}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
