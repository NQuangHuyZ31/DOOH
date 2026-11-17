import React from 'react';
import { AuthCardLayout } from '../components/AuthCardLayout';
import { LoginForm } from '../components/LoginForm';
import { OtpVerificationForm } from '../components/OtpVerificationForm';
import { useLoginFlow } from '../hooks/useLoginFlow';

export const LoginPage: React.FC = () => {
	const { loading, error, otpMode, maskedEmail, clearError, handleLogin, handleVerifyOtp, handleResendOtp, handleBackToLogin } = useLoginFlow();

	return (
		<AuthCardLayout otpMode={otpMode} error={error} onCloseError={clearError}>
			{otpMode ? (
				<OtpVerificationForm loading={loading} maskedEmail={maskedEmail} onVerifyOtp={handleVerifyOtp} onResendOtp={handleResendOtp} onBackToLogin={handleBackToLogin} />
			) : (
				<LoginForm loading={loading} onSubmit={handleLogin} />
			)}
		</AuthCardLayout>
	);
};

export default LoginPage;
