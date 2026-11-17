import React from 'react';
import { Form, Input, Button, Checkbox, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { LoginPayload } from '../types/auth';

const { Title, Text } = Typography;

interface LoginFormProps {
  loading: boolean;
  onSubmit: (values: LoginPayload) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onSubmit }) => {
  const [form] = Form.useForm<LoginPayload>();

  return (
    <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Welcome back
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Enter your corporate credentials to access the DOOH control plane.
        </Text>
      </div>

      <Form
        form={form}
        name="dooh_login"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onSubmit}
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="username_or_email"
          label={<Text strong style={{ fontSize: 13 }}>Work Email / Username</Text>}
          rules={[{ required: true, message: 'Please enter your work email or username' }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
            placeholder="admin@dooh.media"
            autoComplete="username"
            style={{ borderRadius: 10 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Text strong style={{ fontSize: 13 }}>Password</Text>}
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Enter password"
            autoComplete="current-password"
            style={{ borderRadius: 10 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me for 30 days</Checkbox>
            </Form.Item>
            <Button type="link" style={{ padding: 0, fontSize: 13 }}>
              Forgot password?
            </Button>
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            style={{
              height: 46,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 15,
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            Sign In to Console
          </Button>
        </Form.Item>

        <Divider plain style={{ margin: '20px 0', color: '#94a3b8', fontSize: 12 }}>
          Or enterprise access
        </Divider>

        <Button
          block
          icon={<SafetyCertificateOutlined />}
          style={{ height: 44, borderRadius: 10, fontWeight: 500 }}
          onClick={() => {}}
        >
          Single Sign-On (SAML / Keycloak)
        </Button>
      </Form>
    </div>
  );
};

export default LoginForm;
