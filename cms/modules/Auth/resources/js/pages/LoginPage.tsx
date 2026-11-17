import React, { useState } from 'react';
import { Card, Typography, Space, message } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTING_CONFIG } from '@core';
import { authApi } from '../Action/authApi';
import { LoginForm } from '../components/LoginForm';
import type { LoginPayload } from '../types/auth';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (values: LoginPayload) => {
		setLoading(true);
		try {
			const res = await authApi.login(values);
			const token = res.data?.data?.token || 'mock_token';
			localStorage.setItem(ROUTING_CONFIG.auth.tokenKey, token);
			message.success('Login successful! Redirecting...');
			navigate(ROUTING_CONFIG.defaultPath, { replace: true });
		} catch (err: unknown) {
			const errorMsg = typeof err === 'object' && err !== null && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : 'Invalid credentials or server unavailable.';
			message.error(errorMsg || 'Login failed.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				background: 'radial-gradient(circle at 50% 15%, #1e293b 0%, #0f172a 55%, #020617 100%)',
				padding: '24px 16px',
			}}
		>
			<div style={{ textAlign: 'center', marginBottom: 28 }}>
				<div
					style={{
						width: 56,
						height: 56,
						borderRadius: 16,
						background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
						marginBottom: 12,
					}}
				>
					<DesktopOutlined style={{ fontSize: 28, color: '#ffffff' }} />
				</div>
				<Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
					DOOH Media Management
				</Title>
				<Text style={{ color: '#94a3b8', fontSize: 14 }}>Digital Out-Of-Home Network Operations</Text>
			</div>

			<Card
				style={{
					width: '100%',
					maxWidth: 420,
					borderRadius: 16,
					boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
					border: '1px solid rgba(255, 255, 255, 0.08)',
				}}
			>
				<LoginForm loading={loading} onSubmit={handleLogin} />
			</Card>

			<div style={{ marginTop: 24, textAlign: 'center' }}>
				<Text style={{ color: '#64748b', fontSize: 12 }}>© 2026 DOOH Media Platform. All rights reserved.</Text>
			</div>
		</div>
	);
};

export default LoginPage;
