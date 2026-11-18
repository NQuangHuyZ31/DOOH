import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthCardLayout } from '../components/AuthCardLayout';
import { LoginForm } from '../components/LoginForm';
import { OtpVerificationForm } from '../components/OtpVerificationForm';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useLoginFlow } from '../hooks/useLoginFlow';

export const LoginPage: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const isResetPassword = searchParams.get('reset-password') === '1';
	const resetToken = searchParams.get('token') || '';
	const resetEmail = searchParams.get('email') || '';

	const [resetError, setResetError] = useState<string | null>(null);

	const { loading, error: loginError, otpMode, maskedEmail, clearError: clearLoginError, handleLogin, handleVerifyOtp, handleResendOtp, handleBackToLogin } = useLoginFlow();

	const handleExitResetMode = () => {
		setResetError(null);
		setSearchParams({});
	};

	const currentError = isResetPassword ? resetError : loginError;
	const handleCloseError = isResetPassword ? () => setResetError(null) : clearLoginError;
	const activeMode = isResetPassword ? 'reset-password' : otpMode ? 'otp' : 'login';

	return (
		<AuthCardLayout mode={activeMode} error={currentError} onCloseError={handleCloseError}>
			{isResetPassword ? (
				<ResetPasswordForm email={resetEmail} token={resetToken} onSuccess={handleExitResetMode} onBackToLogin={handleExitResetMode} onError={(msg) => setResetError(msg)} />
			) : otpMode ? (
				<OtpVerificationForm loading={loading} maskedEmail={maskedEmail} onVerifyOtp={handleVerifyOtp} onResendOtp={handleResendOtp} onBackToLogin={handleBackToLogin} />
			) : (
				<LoginForm loading={loading} onSubmit={handleLogin} />
			)}
		</AuthCardLayout>
	);
};

export default LoginPage;
