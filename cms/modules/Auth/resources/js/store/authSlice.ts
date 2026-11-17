import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAuthToken, setAuthToken, clearAuthToken } from '@core/utils/tokenStorage';
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

const initialToken = getAuthToken();

const initialState: AuthState = {
    token: initialToken,
    user: null,
    isAuthenticated: !!initialToken,
    isInitialized: false,
    loading: false,
    error: null,
};

const resetAuthState = (state: AuthState) => {
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
    state.isInitialized = true;
    state.error = null;
    clearAuthToken();
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
            setAuthToken(action.payload.token);
        },
        clearAuth: (state) => {
            resetAuthState(state);
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
                resetAuthState(state);
                state.error = action.payload || null;
            })
            .addCase(logout.fulfilled, (state) => {
                resetAuthState(state);
            })
            .addCase(logout.rejected, (state) => {
                resetAuthState(state);
            });
    },
});

export const { setCredentials, clearAuth, setInitialized } = authSlice.actions;
export default authSlice.reducer;
