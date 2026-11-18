import React from 'react';
import { Alert, theme, Typography } from 'antd';
import { KeyOutlined, MailOutlined, SafetyCertificateFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface LoginHeaderBadgeProps {
	otpMode?: boolean;
	mode?: 'login' | 'otp' | 'reset-password';
	error: string | null;
	onCloseError: () => void;
}

export const LoginHeaderBadge: React.FC<LoginHeaderBadgeProps> = ({ otpMode = false, mode = 'login', error, onCloseError }) => {
	const { token: antdTheme } = theme.useToken();
	const activeMode = mode !== 'login' ? mode : otpMode ? 'otp' : 'login';

	const renderIcon = () => {
		if (activeMode === 'reset-password') {
			return <KeyOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />;
		}
		if (activeMode === 'otp') {
			return <MailOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />;
		}
		return <SafetyCertificateFilled style={{ fontSize: 24, color: antdTheme.colorPrimary }} />;
	};

	const getTitle = () => {
		if (activeMode === 'reset-password') return 'Set New Password';
		if (activeMode === 'otp') return 'Email Verification';
		return 'Welcome Back';
	};

	const getSubtitle = () => {
		if (activeMode === 'reset-password') return 'Enter your new password to regain account access';
		if (activeMode === 'otp') return 'Enter the 6-digit code sent to your email';
		return 'Enter your credentials to access DOOH CMS';
	};

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
					{renderIcon()}
				</div>
				<Title level={3} style={{ margin: 0, fontWeight: 700, color: antdTheme.colorPrimary }}>
					{getTitle()}
				</Title>
				<Text type="secondary" style={{ fontSize: 13 }}>
					{getSubtitle()}
				</Text>
			</div>

			{error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 8 }} closable onClose={onCloseError} />}
		</>
	);
};

export default LoginHeaderBadge;
