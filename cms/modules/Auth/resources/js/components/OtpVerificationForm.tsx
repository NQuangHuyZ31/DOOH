import React, { useState } from 'react';
import { Button, Flex, Input, Space, Typography } from 'antd';
import { ArrowLeftOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { AUTH_PRIMARY_BUTTON_STYLE } from '../configs/authConfig';

const { Text, Paragraph } = Typography;

export interface OtpVerificationFormProps {
  loading: boolean;
  maskedEmail?: string;
  onVerifyOtp: (code: string) => Promise<void>;
  onResendOtp?: () => Promise<void>;
  onBackToLogin?: () => void;
}

export const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  loading,
  maskedEmail,
  onVerifyOtp,
  onResendOtp,
  onBackToLogin,
}) => {
  const [otp, setOtp] = useState<string>('');
  const [resending, setResending] = useState<boolean>(false);

  const handleComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6 && !loading) {
      void onVerifyOtp(value);
    }
  };

  const handleManualSubmit = () => {
    if (otp.length === 6 && !loading) {
      void onVerifyOtp(otp);
    }
  };

  const handleResend = async () => {
    if (!onResendOtp || resending || loading) return;
    setResending(true);
    try {
      await onResendOtp();
      setOtp('');
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ padding: '8px 0' }}>
          <MailOutlined style={{ fontSize: 44, color: '#1677ff', marginBottom: 8 }} />
          <Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 4px' }}>
            We sent a 6-digit verification code to
          </Paragraph>
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
            {maskedEmail || 'your email'}
          </Text>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Verification Code
        </Text>
        <Flex justify="center">
          <Input.OTP
            size="large"
            length={6}
            value={otp}
            onChange={handleComplete}
            disabled={loading}
            autoFocus
          />
        </Flex>
      </div>

      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          disabled={otp.length !== 6 || loading}
          onClick={handleManualSubmit}
          style={AUTH_PRIMARY_BUTTON_STYLE}
        >
          Verify & Sign In
        </Button>

        {onResendOtp && (
          <Flex justify="center" style={{ margin: '4px 0' }}>
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              loading={resending}
              disabled={loading}
              onClick={handleResend}
              style={{ fontSize: 13 }}
            >
              Resend Code
            </Button>
          </Flex>
        )}

        <Button
          type="link"
          block
          icon={<ArrowLeftOutlined />}
          onClick={onBackToLogin}
          disabled={loading}
          style={{ fontSize: 13, color: '#64748b' }}
        >
          Back to Login
        </Button>
      </Space>
    </div>
  );
};

export default OtpVerificationForm;
