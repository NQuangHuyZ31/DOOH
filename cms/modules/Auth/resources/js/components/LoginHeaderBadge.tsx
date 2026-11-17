import React from 'react';
import { Typography, theme, Alert } from 'antd';
import { DesktopOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface LoginHeaderBadgeProps {
  otpMode: boolean;
  error: string | null;
  onCloseError: () => void;
}

export const LoginHeaderBadge: React.FC<LoginHeaderBadgeProps> = ({ otpMode, error, onCloseError }) => {
  const { token: antdTheme } = theme.useToken();

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
          {otpMode ? (
            <SafetyCertificateOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />
          ) : (
            <DesktopOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />
          )}
        </div>
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: antdTheme.colorPrimary }}>
          {otpMode ? 'Two-Step Verification' : 'Sign In'}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {otpMode ? 'Verify your identity to proceed' : 'Enter your credentials to access DOOH CMS'}
        </Text>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16, borderRadius: 8 }}
          closable
          onClose={onCloseError}
        />
      )}
    </>
  );
};

export default LoginHeaderBadge;
