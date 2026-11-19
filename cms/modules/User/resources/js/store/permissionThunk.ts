import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PaginatedResponse } from '@core/types/api';
import { extractErrorMessage } from '@core/utils/error';
import { permissionApi } from '../Action/permissionApi';
import type { PermissionFilterParams, PermissionFormData, PermissionItem } from '../types/permission';

export const fetchPermissionsPaginated = createAsyncThunk<
	PaginatedResponse<PermissionItem>,
	(PermissionFilterParams & { page?: number; per_page?: number }) | undefined,
	{ rejectValue: string }
>('permission/fetchPermissionsPaginated', async (params, { rejectWithValue }) => {
	try {
		const response = await permissionApi.getPermissions({
			paginate: true,
			per_page: params?.per_page || 15,
			page: params?.page || 1,
			search: params?.search,
			module: params?.module,
		});
		return response.data as PaginatedResponse<PermissionItem>;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to load permissions.'));
	}
});

export const createPermission = createAsyncThunk<
	PermissionItem,
	PermissionFormData,
	{ rejectValue: string }
>('permission/createPermission', async (payload, { rejectWithValue }) => {
	try {
		const response = await permissionApi.createPermission(payload);
		return response.data.data;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to create permission.'));
	}
});

export const updatePermission = createAsyncThunk<
	PermissionItem,
	{ id: number; payload: Partial<PermissionFormData> },
	{ rejectValue: string }
>('permission/updatePermission', async ({ id, payload }, { rejectWithValue }) => {
	try {
		const response = await permissionApi.updatePermission(id, payload);
		return response.data.data;
	} catch (err: unknown) {
		return rejectWithValue(extractErrorMessage(err, 'Failed to update permission.'));
	}
});

export const deletePermission = createAsyncThunk<number, number, { rejectValue: string }>(
	'permission/deletePermission',
	async (id, { rejectWithValue }) => {
		try {
			await permissionApi.deletePermission(id);
			return id;
		} catch (err: unknown) {
			return rejectWithValue(extractErrorMessage(err, 'Failed to delete permission.'));
		}
	},
);
