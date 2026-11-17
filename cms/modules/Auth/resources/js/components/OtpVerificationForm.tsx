import React from 'react';
import { Form, Input, Button, Typography, Flex } from 'antd';
import { SafetyCertificateOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

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
  const [form] = Form.useForm<{ code: string }>();

  return (
    <Form
      form={form}
      layout="vertical"
      size="large"
      onFinish={(values) => onVerifyOtp(values.code)}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Please enter the 6-digit code sent to <Text strong>{maskedEmail || 'your email'}</Text>
        </Text>
      </div>

      <Form.Item
        name="code"
        rules={[
          { required: true, message: 'Please enter verification code' },
          { len: 6, message: 'Code must be exactly 6 digits' },
        ]}
      >
        <Input
          prefix={<SafetyCertificateOutlined style={{ color: '#94a3b8' }} />}
          placeholder="123456"
          maxLength={6}
          autoFocus
          style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: 700, borderRadius: 8 }}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          style={{
            height: 44,
            fontWeight: 600,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1677ff 0%, #06b6d4 100%)',
            border: 'none',
          }}
        >
          Verify & Sign In
        </Button>
      </Form.Item>

      <Flex justify="space-between" align="center" style={{ marginTop: 16 }}>
        <Button
          type="link"
          icon={<ReloadOutlined />}
          onClick={onResendOtp}
          disabled={loading}
          style={{ padding: 0, fontSize: 13 }}
        >
          Resend code
        </Button>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={onBackToLogin}
          style={{ padding: 0, fontSize: 13 }}
        >
          Back to login
        </Button>
      </Flex>
    </Form>
  );
};

export default OtpVerificationForm;
