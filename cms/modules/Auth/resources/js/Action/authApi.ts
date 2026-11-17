import { http } from '@core';
import type { LoginPayload, AuthResponse, AuthUser } from '../types/auth';

export const authApi = {
  login: (data: LoginPayload) =>
    http.post<{ status: string; message: string; data: AuthResponse }>('/auth/login', data),

  verifyOtp: (data: { temp_token: string; code: string }) =>
    http.post<{ status: string; message: string; data: AuthResponse }>('/auth/verify-otp', data),

  resendOtp: (data: { temp_token: string }) =>
    http.post<{ status: string; message: string; data: { temp_token: string; email: string } }>('/auth/resend-otp', data),

  logout: () =>
    http.post<{ status: string; message: string }>('/auth/logout'),

  me: () =>
    http.get<{ status: string; data: AuthUser }>('/auth/me'),
};

export default authApi;
