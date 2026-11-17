import React from 'react';
import { Form, Input, Button, Checkbox, Flex, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, GoogleOutlined } from '@ant-design/icons';
import type { LoginPayload } from '../types/auth';

export interface LoginFormProps {
  loading: boolean;
  onSubmit: (values: LoginPayload) => Promise<void>;
  onForgotPassword?: () => void;
  onGoogleLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loading,
  onSubmit,
  onForgotPassword,
  onGoogleLogin,
}) => {
  const [form] = Form.useForm<LoginPayload>();

  return (
    <Form
      form={form}
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
