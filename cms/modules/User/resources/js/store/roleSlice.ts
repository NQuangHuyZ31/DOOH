import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPagination } from '@core/configs/pagination';
import type { PermissionItem, RoleFilterParams, RoleItem } from '../types/role';
import { createRole, deleteRole, fetchRolePermissions, fetchRolesPaginated, updateRole } from './roleThunk';

export interface RoleState {
	roles: RoleItem[];
	permissions: PermissionItem[];
	loading: boolean;
	submitting: boolean;
	error: string | null;
	filters: RoleFilterParams;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	modalOpen: boolean;
	editingRole: RoleItem | null;
}

const initialState: RoleState = {
	roles: [],
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
	editingRole: null,
};

export const roleSlice = createSlice({
	name: 'role',
	initialState,
	reducers: {
		setRoleFilters: (state, action: PayloadAction<RoleFilterParams>) => {
			state.filters = action.payload;
			state.pagination.current = 1;
		},
		setRolePagination: (state, action: PayloadAction<{ current: number; pageSize: number }>) => {
			state.pagination.current = action.payload.current;
			state.pagination.pageSize = action.payload.pageSize;
		},
		openCreateRoleModal: (state) => {
			state.editingRole = null;
			state.modalOpen = true;
		},
		openEditRoleModal: (state, action: PayloadAction<RoleItem>) => {
			state.editingRole = action.payload;
			state.modalOpen = true;
		},
		closeRoleModal: (state) => {
			state.modalOpen = false;
			state.editingRole = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRolesPaginated.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchRolesPaginated.fulfilled, (state, action) => {
				state.loading = false;
				state.roles = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.pagination.current = action.payload.pagination.current_page;
					state.pagination.pageSize = action.payload.pagination.per_page;
					state.pagination.total = action.payload.pagination.total;
				}
			})
			.addCase(fetchRolesPaginated.rejected, (state, action) => {
				state.loading = false;
				state.roles = [];
				state.error = action.payload || null;
			})
			.addCase(fetchRolePermissions.fulfilled, (state, action) => {
				state.permissions = action.payload;
			})
			.addCase(createRole.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(createRole.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
			})
			.addCase(createRole.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(updateRole.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(updateRole.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
				state.editingRole = null;
			})
			.addCase(updateRole.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(deleteRole.pending, (state) => {
				state.submitting = true;
			})
			.addCase(deleteRole.fulfilled, (state, action) => {
				state.submitting = false;
				state.roles = state.roles.filter((r) => r.id !== action.payload);
				state.pagination.total = Math.max(0, state.pagination.total - 1);
			})
			.addCase(deleteRole.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			});
	},
});

export const {
	setRoleFilters,
	setRolePagination,
	openCreateRoleModal,
	openEditRoleModal,
	closeRoleModal,
} = roleSlice.actions;

export default roleSlice.reducer;
