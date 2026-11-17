import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ROUTING_CONFIG } from '@core';
import type { AuthUser } from '../types/auth';
import { fetchMe, logout } from './authThunk';

export interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    loading: boolean;
    error: string | null;
}

const initialToken = localStorage.getItem(ROUTING_CONFIG.auth.tokenKey);

const initialState: AuthState = {
    token: initialToken,
    user: null,
    isAuthenticated: !!initialToken,
    isInitialized: false,
    loading: false,
    error: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ token: string; user?: AuthUser }>
        ) => {
            state.token = action.payload.token;
            if (action.payload.user) {
                state.user = action.payload.user;
            }
            state.isAuthenticated = true;
            state.isInitialized = true;
            state.error = null;
            localStorage.setItem(ROUTING_CONFIG.auth.tokenKey, action.payload.token);
        },
        clearAuth: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.isInitialized = true;
            state.error = null;
            localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
        },
        setInitialized: (state, action: PayloadAction<boolean>) => {
            state.isInitialized = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.isInitialized = true;
                state.error = null;
            })
            .addCase(fetchMe.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.token = null;
                state.isInitialized = true;
                state.error = action.payload || null;
                localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
            })
            .addCase(logout.fulfilled, (state) => {
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
                state.isInitialized = true;
                state.error = null;
                localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
            })
            .addCase(logout.rejected, (state) => {
                state.token = null;
                state.user = null;
                state.isAuthenticated = false;
                state.isInitialized = true;
                state.error = null;
                localStorage.removeItem(ROUTING_CONFIG.auth.tokenKey);
            });
    },
});

export const { setCredentials, clearAuth, setInitialized } = authSlice.actions;
export { fetchMe, logout } from './authThunk';
export default authSlice.reducer;
