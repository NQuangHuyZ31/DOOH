import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDefaultRoutePath } from '@core/routes/registry';
import { useAppDispatch } from '@core/store/hooks';
import { extractErrorMessage } from '@core/utils/error';
import { authApi } from '../Action/authApi';
import { setCredentials } from '../store/authSlice';
import type { LoginPayload } from '../types/auth';

export function useLoginFlow() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otpMode, setOtpMode] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);
    const [maskedEmail, setMaskedEmail] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const redirectPath =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        getDefaultRoutePath();

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleBackToLogin = useCallback(() => {
        setOtpMode(false);
        setError(null);
    }, []);

    const handleLogin = useCallback(
        async (values: LoginPayload) => {
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
                setError(extractErrorMessage(err, 'Invalid credentials or server unavailable.'));
            } finally {
                setLoading(false);
            }
        },
        [dispatch, navigate, redirectPath]
    );

    const handleVerifyOtp = useCallback(
        async (code: string) => {
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
                setError(extractErrorMessage(err, 'Verification failed. Please check the code.'));
            } finally {
                setLoading(false);
            }
        },
        [dispatch, navigate, redirectPath, tempToken]
    );

    const handleResendOtp = useCallback(async () => {
        if (!tempToken) return;
        try {
            await authApi.resendOtp({ temp_token: tempToken });
            message.success('Fresh verification code dispatched to your email.');
        } catch {
            message.error('Failed to resend code. Please try again.');
        }
    }, [tempToken]);

    return {
        loading,
        error,
        otpMode,
        maskedEmail,
        clearError,
        handleLogin,
        handleVerifyOtp,
        handleResendOtp,
        handleBackToLogin,
    };
}

export default useLoginFlow;
