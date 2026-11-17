import { http } from '@core/Action/api';
import type { ApiResponse } from '@core/types/api';
import type {
    LoginPayload,
    VerifyOtpPayload,
    ResendOtpPayload,
    ResendOtpResponse,
    AuthResponse,
    AuthUser,
} from '../types/auth';

export const authApi = {
    login: (data: LoginPayload) =>
        http.post<ApiResponse<AuthResponse>>('/auth/login', data),

    verifyOtp: (data: VerifyOtpPayload) =>
        http.post<ApiResponse<AuthResponse>>('/auth/verify-otp', data),

    resendOtp: (data: ResendOtpPayload) =>
        http.post<ApiResponse<ResendOtpResponse>>('/auth/resend-otp', data),

    logout: () =>
        http.post<ApiResponse<null>>('/auth/logout'),

    me: () =>
        http.get<ApiResponse<AuthUser>>('/auth/me'),
};

export default authApi;
