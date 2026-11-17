import React from 'react';
import { Form, Input, Button, Checkbox, Flex, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, GoogleOutlined } from '@ant-design/icons';
import { AUTH_PRIMARY_BUTTON_STYLE } from '../configs/authConfig';
import type { LoginPayload } from '../types/auth';

export interface LoginFormProps {
	loading: boolean;
	onSubmit: (values: LoginPayload) => Promise<void>;
	onForgotPassword?: () => void;
	onGoogleLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onSubmit, onForgotPassword, onGoogleLogin }) => {
	const [form] = Form.useForm<LoginPayload>();

	return (
		<Form form={form} layout="vertical" size="large" initialValues={{ remember: true }} onFinish={onSubmit}>
			<Form.Item name="username_or_email" rules={[{ required: true, message: 'Please enter your work email or username' }]}>
				<Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Work email or username" autoComplete="username" />
			</Form.Item>

			<Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
				<Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password" autoComplete="current-password" />
			</Form.Item>

			<Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
				<Form.Item name="remember" valuePropName="checked" noStyle>
					<Checkbox>Remember me</Checkbox>
				</Form.Item>
				{onForgotPassword && (
					<Button type="link" onClick={onForgotPassword} style={{ padding: 0, fontSize: 13 }}>
						Forgot password?
					</Button>
				)}
			</Flex>

			<Form.Item style={{ marginBottom: onGoogleLogin ? 16 : 0 }}>
				<Button type="primary" htmlType="submit" block loading={loading} icon={<LoginOutlined />} style={AUTH_PRIMARY_BUTTON_STYLE}>
					Sign In
				</Button>
			</Form.Item>

			{onGoogleLogin && (
				<>
					<Divider plain style={{ margin: '16px 0', color: '#94a3b8', fontSize: 12 }}>
						or continue with
					</Divider>

					<Button block icon={<GoogleOutlined />} style={{ height: 44, borderRadius: 8, fontWeight: 500 }} onClick={onGoogleLogin}>
						Sign in with Google
					</Button>
				</>
			)}
		</Form>
	);
};

export default LoginForm;
