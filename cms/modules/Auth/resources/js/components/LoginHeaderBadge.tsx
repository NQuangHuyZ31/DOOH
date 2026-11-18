import React from 'react';
import { Typography, theme, Alert } from 'antd';
import { MailOutlined, SafetyCertificateFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface LoginHeaderBadgeProps {
  otpMode: boolean;
  error: string | null;
  onCloseError: () => void;
}

export const LoginHeaderBadge: React.FC<LoginHeaderBadgeProps> = ({
  otpMode,
  error,
  onCloseError,
}) => {
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
            <MailOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />
          ) : (
            <SafetyCertificateFilled style={{ fontSize: 24, color: antdTheme.colorPrimary }} />
          )}
        </div>
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: antdTheme.colorPrimary }}>
          {otpMode ? 'Email Verification' : 'Welcome Back'}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {otpMode
            ? 'Enter the 6-digit code sent to your email'
            : 'Enter your credentials to access DOOH CMS'}
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
