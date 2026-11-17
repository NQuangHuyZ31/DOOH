import { http } from '@core';
import type { LoginPayload, AuthResponse, AuthUser } from '../types/auth';

export const authApi = {
  login: (data: LoginPayload) =>
    http.post<{ status: string; data: AuthResponse }>('/auth/login', data),

  logout: () =>
    http.post<{ status: string; message: string }>('/auth/logout'),

  me: () =>
    http.get<{ status: string; data: AuthUser }>('/auth/me'),
};

export default authApi;
