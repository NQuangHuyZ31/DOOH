import React, { useState } from 'react';
import { Card, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTING_CONFIG, useAppDispatch } from '@core';
import { authApi } from '../Action/authApi';
import { setCredentials } from '../store/authSlice';
import { LoginForm } from '../components/LoginForm';
import { OtpVerificationForm } from '../components/OtpVerificationForm';
import { LoginHeroBanner } from '../components/LoginHeroBanner';
import { LoginHeaderBadge } from '../components/LoginHeaderBadge';
import type { LoginPayload } from '../types/auth';

export const LoginPage: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [otpMode, setOtpMode] = useState(false);
	const [tempToken, setTempToken] = useState<string | null>(null);
	const [maskedEmail, setMaskedEmail] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useAppDispatch();

	const redirectPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || ROUTING_CONFIG.defaultPath;

	const handleLogin = async (values: LoginPayload) => {
		setLoading(true);
		setError(null);
		try {
			const res = await authApi.login(values);
			const data = res.data?.data;
			if (data?.require_otp || data?.step === 'email_otp') {
				setOtpMode(true);
				setTempToken(data.temp_token || null);
				setMaskedEmail(data.email || '');
				message.info('Verification code dispatched to your email.');
			} else if (data?.token) {
				dispatch(setCredentials({ token: data.token, user: data.user }));
				message.success('Login successful. Redirecting...');
				navigate(redirectPath, { replace: true });
			}
		} catch (err: unknown) {
			const errorMsg = typeof err === 'object' && err !== null && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : 'Invalid credentials or server unavailable.';
			setError(errorMsg || 'Login failed.');
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyOtp = async (code: string) => {
		if (!tempToken) return;
		setLoading(true);
		setError(null);
		try {
			const res = await authApi.verifyOtp({ temp_token: tempToken, code });
			const data = res.data?.data;
			if (data?.token) {
				dispatch(setCredentials({ token: data.token, user: data.user }));
				message.success('Verification passed. Redirecting...');
				navigate(redirectPath, { replace: true });
			}
		} catch (err: unknown) {
			const errorMsg = typeof err === 'object' && err !== null && 'response' in err ? (err as { response?: { data?: { message?: string } } }).response?.data?.message : 'Verification failed. Please check the code.';
			setError(errorMsg || 'Verification failed.');
		} finally {
			setLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (!tempToken) return;
		try {
			await authApi.resendOtp({ temp_token: tempToken });
			message.success('Fresh verification code dispatched to your email.');
		} catch {
			message.error('Failed to resend code. Please try again.');
		}
	};

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 10% 20%, #0b1120 0%, #030712 100%)', padding: 24 }}>
			<Card style={{ width: '100%', maxWidth: 960, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)' }} styles={{ body: { padding: 0 } }}>
				<div style={{ display: 'flex', minHeight: 560 }}>
					<div style={{ width: '48%', display: 'flex' }}>
						<LoginHeroBanner />
					</div>
					<div style={{ flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#ffffff' }}>
						<LoginHeaderBadge otpMode={otpMode} error={error} onCloseError={() => setError(null)} />
						{otpMode ? (
							<OtpVerificationForm
								loading={loading}
								maskedEmail={maskedEmail}
								onVerifyOtp={handleVerifyOtp}
								onResendOtp={handleResendOtp}
								onBackToLogin={() => {
									setOtpMode(false);
									setError(null);
								}}
							/>
						) : (
							<LoginForm loading={loading} onSubmit={handleLogin} onForgotPassword={() => {}} onGoogleLogin={() => {}} />
						)}
					</div>
				</div>
			</Card>
		</div>
	);
};

export default LoginPage;
