import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPagination } from '@core/configs/pagination';
import type { PermissionItem, RoleItem, UserFilterParams, UserItem } from '../types/user';
import { createUser, deleteUser, fetchPermissions, fetchRoles, fetchUsers, updateUser } from './userThunk';

export interface UserState {
	users: UserItem[];
	roles: RoleItem[];
	permissions: PermissionItem[];
	loading: boolean;
	submitting: boolean;
	error: string | null;
	filters: UserFilterParams;
	pagination: {
		current: number;
		pageSize: number;
		total: number;
	};
	modalOpen: boolean;
	editingUser: UserItem | null;
}

const initialState: UserState = {
	users: [],
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
	editingUser: null,
};

export const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setUserFilters: (state, action: PayloadAction<UserFilterParams>) => {
			state.filters = action.payload;
			state.pagination.current = 1;
		},
		setUserPagination: (state, action: PayloadAction<{ current: number; pageSize: number }>) => {
			state.pagination.current = action.payload.current;
			state.pagination.pageSize = action.payload.pageSize;
		},
		openCreateUserModal: (state) => {
			state.editingUser = null;
			state.modalOpen = true;
		},
		openEditUserModal: (state, action: PayloadAction<UserItem>) => {
			state.editingUser = action.payload;
			state.modalOpen = true;
		},
		closeUserModal: (state) => {
			state.modalOpen = false;
			state.editingUser = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchUsers.fulfilled, (state, action) => {
				state.loading = false;
				state.users = action.payload?.data || [];
				if (action.payload?.pagination) {
					state.pagination.current = action.payload.pagination.current_page;
					state.pagination.pageSize = action.payload.pagination.per_page;
					state.pagination.total = action.payload.pagination.total;
				}
			})
			.addCase(fetchUsers.rejected, (state, action) => {
				state.loading = false;
				state.users = [];
				state.error = action.payload || null;
			})
			.addCase(fetchRoles.fulfilled, (state, action) => {
				state.roles = action.payload;
			})
			.addCase(fetchPermissions.fulfilled, (state, action) => {
				state.permissions = action.payload;
			})
			.addCase(createUser.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(createUser.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
			})
			.addCase(createUser.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(updateUser.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(updateUser.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
			})
			.addCase(updateUser.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
			})
			.addCase(deleteUser.pending, (state) => {
				state.error = null;
			})
			.addCase(deleteUser.rejected, (state, action) => {
				state.error = action.payload || null;
			});
	},
});

export const {
	setUserFilters,
	setUserPagination,
	openCreateUserModal,
	openEditUserModal,
	closeUserModal,
} = userSlice.actions;

export default userSlice.reducer;
