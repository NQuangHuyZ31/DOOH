import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PaginatedResponse } from '@core/types/api';
import { extractErrorMessage } from '@core/utils/error';
import { permissionApi } from '../Action/permissionApi';
import { roleApi } from '../Action/roleApi';
import type { PermissionItem, RoleFilterParams, RoleFormData, RoleItem } from '../types/role';

export const fetchRolesPaginated = createAsyncThunk<
	PaginatedResponse<RoleItem>,
	(RoleFilterParams & { page?: number; per_page?: number }) | undefined,
	{ rejectValue: string }
>('role/fetchRolesPaginated', async (params, { rejectWithValue }) => {
	try {
		const response = await roleApi.getRoles({
			paginate: true,
			per_page: params?.per_page || 15,
			page: params?.page || 1,
			search: params?.search,
		});
		return response.data as PaginatedResponse<RoleItem>;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to load roles.'));
	}
});

export const fetchRolePermissions = createAsyncThunk<PermissionItem[], void, { rejectValue: string }>(
	'role/fetchRolePermissions',
	async (_, { rejectWithValue }) => {
		try {
			const response = await permissionApi.getPermissions();
			return response.data?.data || [];
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to load permissions.'));
		}
	},
);

export const createRole = createAsyncThunk<RoleItem, RoleFormData, { rejectValue: string }>(
	'role/createRole',
	async (payload, { rejectWithValue }) => {
		try {
			const response = await roleApi.createRole(payload);
			return response.data.data;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to create role.'));
		}
	},
);

export const updateRole = createAsyncThunk<
	RoleItem,
	{ id: number; payload: Partial<RoleFormData> },
	{ rejectValue: string }
>('role/updateRole', async ({ id, payload }, { rejectWithValue }) => {
	try {
		const response = await roleApi.updateRole(id, payload);
		return response.data.data;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to update role.'));
	}
});

export const deleteRole = createAsyncThunk<number, number, { rejectValue: string }>(
	'role/deleteRole',
	async (id, { rejectWithValue }) => {
		try {
			await roleApi.deleteRole(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete role.'));
		}
	},
);
