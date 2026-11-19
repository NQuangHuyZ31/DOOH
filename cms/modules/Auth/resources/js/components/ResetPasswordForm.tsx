import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../Action/authApi';
import { extractErrorMessage } from '@core/utils/error';

export interface ResetPasswordFormProps {
	email: string;
	token: string;
	onSuccess: () => void;
	onBackToLogin: () => void;
	onError: (msg: string) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ email, token, onSuccess, onBackToLogin, onError }) => {
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (values: { password: string; password_confirmation: string }) => {
		try {
			setSubmitting(true);
			await authApi.resetPassword({
				email,
				token,
				password: values.password,
				password_confirmation: values.password_confirmation,
			});
			message.success('Password reset successfully. You can now login with your new password.');
			onSuccess();
		} catch (err: unknown) {
			const errorMsg = extractErrorMessage(err, 'Failed to reset password. The link may have expired.');
			onError(errorMsg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ email }} requiredMark={false}>
			<Form.Item name="email" label="Email Address">
				<Input prefix={<MailOutlined />} disabled style={{ color: '#1e293b', fontWeight: 500 }} />
			</Form.Item>

			<Form.Item
				name="password"
				label="New Password"
				rules={[
					{ required: true, message: 'Please enter a new password' },
					{ min: 8, message: 'Password must be at least 8 characters' },
				]}
				hasFeedback
			>
				<Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
			</Form.Item>

			<Form.Item
				name="password_confirmation"
				label="Confirm New Password"
				dependencies={['password']}
				hasFeedback
				rules={[
					{ required: true, message: 'Please confirm your new password' },
					({ getFieldValue }) => ({
						validator(_, value) {
							if (!value || getFieldValue('password') === value) {
								return Promise.resolve();
							}
							return Promise.reject(new Error('The two passwords do not match'));
						},
					}),
				]}
			>
				<Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
			</Form.Item>

			<Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
				<Button type="primary" htmlType="submit" loading={submitting} block style={{ height: 42, fontWeight: 600 }}>
					Reset Password
				</Button>
			</Form.Item>

			<div style={{ textAlign: 'center' }}>
				<Button type="link" onClick={onBackToLogin} style={{ padding: 0, fontSize: 13 }}>
					Return to login
				</Button>
			</div>
		</Form>
	);
};

export default ResetPasswordForm;
