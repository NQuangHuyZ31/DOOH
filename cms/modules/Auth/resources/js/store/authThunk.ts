import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../Action/authApi';
import type { AuthUser } from '../types/auth';

export const fetchMe = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
    'auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.me();
            return response.data.data;
        } catch (err: unknown) {
            const message =
                typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                    : 'Failed to authenticate session.';
            return rejectWithValue(message || 'Session expired.');
        }
    }
);

export const logout = createAsyncThunk<void, void>(
    'auth/logout',
    async () => {
        try {
            await authApi.logout();
        } catch {
            // Ignore network or token expiration errors on logout
        }
    }
);
