import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RoleItem, UserFilterParams, UserItem } from '../types/user';
import { createUser, deleteUser, fetchRoles, fetchUsers, updateUser } from './userThunk';

const INITIAL_ROLES: RoleItem[] = [
	{ id: 1, name: 'super_admin', display_name: 'Super Admin' },
	{ id: 2, name: 'admin', display_name: 'Admin' },
	{ id: 3, name: 'operator', display_name: 'Operator' },
	{ id: 4, name: 'viewer', display_name: 'Viewer' },
];

export interface UserState {
	users: UserItem[];
	roles: RoleItem[];
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
	roles: INITIAL_ROLES,
	loading: false,
	submitting: false,
	error: null,
	filters: {},
	pagination: {
		current: 1,
		pageSize: 15,
		total: 0,
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
				if (action.payload.length > 0) {
					state.roles = action.payload;
				}
			})
			.addCase(createUser.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(createUser.fulfilled, (state) => {
				state.submitting = false;
				state.modalOpen = false;
				state.editingUser = null;
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
				state.editingUser = null;
			})
			.addCase(updateUser.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload || null;
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
