import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractErrorMessage } from '@core/utils/error';
import { authApi } from '../Action/authApi';
import type { AuthUser } from '../types/auth';

export const fetchMe = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
    'auth/fetchMe',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authApi.me();
            return response.data.data;
        } catch (err: unknown) {
            return rejectWithValue(extractErrorMessage(err, 'Session expired.'));
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
