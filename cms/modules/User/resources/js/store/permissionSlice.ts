import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPagination } from '@core/configs/pagination';
import type { PermissionFilterParams, PermissionItem } from '../types/permission';
import {
	createPermission,
	deletePermission,
	fetchPermissionsPaginated,
	updatePermission,
} from './permissionThunk';

export interface PermissionState {
	permissions: PermissionItem[];
	loading: boolean;
	submitting: boolean;
	error: string | null;
	filters: PermissionFilterParams;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	modalOpen: boolean;
	editingPermission: PermissionItem | null;
}

const initialState: PermissionState = {
	permissions: [],
	loading: false,
	submitting: false,
	error: null,
	filters: {},
	pagination: {
		current: defaultPagination.current,
		pageSize: defaultPagination.pageSize,
		total: defaultPagination.total,
	},
	modalOpen: false,
	editingPermission: null,
};

export const permissionSlice = createSlice({
	name: 'permission',
	initialState,
	reducers: {
		setPermissionFilters: (state, action: PayloadAction<PermissionFilterParams>) => {
			state.filters = action.payload;
			state.pagination.current = 1;
		},
		setPermissionPagination: (
			state,
			action: PayloadAction<{ current: number; pageSize: number }>,
		) => {
			state.pagination.current = action.payload.current;
			state.pagination.pageSize = action.payload.pageSize;
		},
		openCreatePermissionModal: (state) => {
			state.editingPermission = null;
			state.modalOpen = true;
		},
		openEditPermissionModal: (state, action: PayloadAction<PermissionItem>) => {
			state.editingPermission = action.payload;
			state.modalOpen = true;
		},
		closePermissionModal: (state) => {
			state.modalOpen = false;
			state.editingPermission = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPermissionsPaginated.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchPermissionsPaginated.fulfilled, (state, action) => {
				state.loading = false;
				state.permissions = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.pagination.current = action.payload.pagination.current_page;
					state.pagination.pageSize = action.payload.pagination.per_page;
					state.pagination.total = action.payload.pagination.total;
				}
			})
			.addCase(fetchPermissionsPaginated.rejected, (state, action) => {
				state.loading = false;
				state.permissions = [];
				state.error = action.payload || null;
			})
			.addCase(createPermission.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(createPermission.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
			})
			.addCase(createPermission.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(updatePermission.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(updatePermission.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
				state.editingPermission = null;
			})
			.addCase(updatePermission.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(deletePermission.pending, (state) => {
				state.submitting = true;
			})
			.addCase(deletePermission.fulfilled, (state, action) => {
				state.submitting = false;
				state.permissions = state.permissions.filter((p) => p.id !== action.payload);
				state.pagination.total = Math.max(0, state.pagination.total - 1);
			})
			.addCase(deletePermission.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			});
	},
});

export const {
	setPermissionFilters,
	setPermissionPagination,
	openCreatePermissionModal,
	openEditPermissionModal,
	closePermissionModal,
} = permissionSlice.actions;

export default permissionSlice.reducer;
