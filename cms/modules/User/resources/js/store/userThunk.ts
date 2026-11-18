import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PaginatedResponse } from '@core/types/api';
import { extractErrorMessage } from '@core/utils/error';
import { userApi } from '../Action/userApi';
import type { PermissionItem, RoleItem, UserFilterParams, UserFormData, UserItem } from '../types/user';

export const fetchUsers = createAsyncThunk<
	PaginatedResponse<UserItem>,
	UserFilterParams | undefined,
	{ rejectValue: string }
>('user/fetchUsers', async (params, { rejectWithValue }) => {
	try {
		const response = await userApi.getUsers(params);
		return response.data;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to load users.'));
	}
});

export const fetchRoles = createAsyncThunk<RoleItem[], void, { rejectValue: string }>(
	'user/fetchRoles',
	async (_, { rejectWithValue }) => {
		try {
			const response = await userApi.getRoles();
			const data = response.data;
			if (data && 'data' in data && Array.isArray(data.data)) {
				return data.data;
			}
			return [];
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to load roles.'));
		}
	},
);

export const fetchPermissions = createAsyncThunk<PermissionItem[], void, { rejectValue: string }>(
	'user/fetchPermissions',
	async (_, { rejectWithValue }) => {
		try {
			const response = await userApi.getPermissions();
			return response.data?.data || [];
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to load permissions.'));
		}
	},
);

export const createUser = createAsyncThunk<UserItem, UserFormData, { rejectValue: string }>(
	'user/createUser',
	async (payload, { rejectWithValue }) => {
		try {
			const response = await userApi.createUser(payload);
			return response.data.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create user.'));
		}
	},
);

export const updateUser = createAsyncThunk<
	UserItem,
	{ id: number; payload: Partial<UserFormData> },
	{ rejectValue: string }
>('user/updateUser', async ({ id, payload }, { rejectWithValue }) => {
	try {
		const response = await userApi.updateUser(id, payload);
		return response.data.data;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to update user.'));
	}
});

export const deleteUser = createAsyncThunk<number, number, { rejectValue: string }>(
	'user/deleteUser',
	async (id, { rejectWithValue }) => {
		try {
			await userApi.deleteUser(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete user.'));
		}
	},
);

export const sendUserResetPassword = createAsyncThunk<void, number, { rejectValue: string }>(
	'user/sendResetPassword',
	async (id, { rejectWithValue }) => {
		try {
			await userApi.sendResetPassword(id);
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to send password reset email.'));
		}
	},
);
