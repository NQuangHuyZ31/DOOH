import React from 'react';
import { Form, Input, Button, Checkbox, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import type { LoginPayload } from '../types/auth';

interface LoginFormProps {
	loading: boolean;
	onSubmit: (values: LoginPayload) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loading, onSubmit }) => {
	const [form] = Form.useForm<LoginPayload>();

	const handleFinish = async (values: LoginPayload) => {
		await onSubmit(values);
	};

	return (
		<Form form={form} name="dooh_login" layout="vertical" initialValues={{ remember: true }} onFinish={handleFinish} requiredMark={false} size="large">
			<Form.Item name="username_or_email" label="Username or Email" rules={[{ required: true, message: 'Please enter your username or email' }]}>
				<Input prefix={<UserOutlined style={{ color: '#8c8c8c' }} />} placeholder="admin@dooh.media" autoComplete="username" />
			</Form.Item>

			<Form.Item
				name="password"
				label="Password"
				rules={[
					{ required: true, message: 'Please enter your password' },
					{ min: 6, message: 'Password must be at least 6 characters' },
				]}
			>
				<Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="Enter password" autoComplete="current-password" />
			</Form.Item>

			<Form.Item>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Form.Item name="remember" valuePropName="checked" noStyle>
						<Checkbox>Remember me</Checkbox>
					</Form.Item>
					<Button type="link" style={{ padding: 0 }}>
						Forgot password?
					</Button>
				</div>
			</Form.Item>

			<Form.Item style={{ marginBottom: 0 }}>
				<Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontWeight: 600 }}>
					Sign In
				</Button>
			</Form.Item>
		</Form>
	);
};

export default LoginForm;
