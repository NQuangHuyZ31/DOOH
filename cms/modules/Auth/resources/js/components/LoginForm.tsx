import React from 'react';
import { Form, Input, Button, Checkbox, Flex, Divider, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, GoogleOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { LoginPayload } from '../types/auth';

const { Text } = Typography;

export interface LoginFormProps {
  loading: boolean;
  otpMode: boolean;
  maskedEmail?: string;
  onSubmit: (values: LoginPayload) => Promise<void>;
  onVerifyOtp: (code: string) => Promise<void>;
  onResendOtp?: () => Promise<void>;
  onBackToLogin?: () => void;
  onForgotPassword?: () => void;
  onGoogleLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loading,
  otpMode,
  maskedEmail,
  onSubmit,
  onVerifyOtp,
  onResendOtp,
  onBackToLogin,
  onForgotPassword,
  onGoogleLogin,
}) => {
  const [loginForm] = Form.useForm<LoginPayload>();
  const [otpForm] = Form.useForm<{ code: string }>();

  if (otpMode) {
    return (
      <Form
        form={otpForm}
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

        <Flex justify="space-between" align="center" style={{ marginTop: 12 }}>
          <Button type="link" onClick={onResendOtp} style={{ padding: 0, fontSize: 13 }}>
            Resend code
          </Button>
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBackToLogin} style={{ padding: 0, fontSize: 13 }}>
            Back to login
          </Button>
        </Flex>
      </Form>
    );
  }

  return (
    <Form
      form={loginForm}
      layout="vertical"
      size="large"
      initialValues={{ remember: true }}
      onFinish={onSubmit}
    >
      <Form.Item
        name="username_or_email"
        rules={[{ required: true, message: 'Please enter your work email or username' }]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Work email or username"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please enter your password' }]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>
        <Button type="link" onClick={onForgotPassword} style={{ padding: 0, fontSize: 13 }}>
          Forgot password?
        </Button>
      </Flex>

      <Form.Item style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          icon={<LoginOutlined />}
          style={{
            height: 44,
            fontWeight: 600,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1677ff 0%, #06b6d4 100%)',
            border: 'none',
          }}
        >
          Sign In
        </Button>
      </Form.Item>

      <Divider plain style={{ margin: '16px 0', color: '#94a3b8', fontSize: 12 }}>
        or continue with
      </Divider>

      <Button
        block
        icon={<GoogleOutlined />}
        style={{ height: 44, borderRadius: 8, fontWeight: 500 }}
        onClick={onGoogleLogin}
      >
        Sign in with Google
      </Button>
    </Form>
  );
};

export default LoginForm;
