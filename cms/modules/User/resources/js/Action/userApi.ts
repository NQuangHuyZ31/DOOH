import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { UserFilterParams, UserFormData, UserItem } from '../types/user';
import { roleApi } from './roleApi';
import { permissionApi } from './permissionApi';

export const userApi = {
	getUsers(params?: UserFilterParams) {
		return http.get<PaginatedResponse<UserItem>>('/user', { params });
	},

	getUser(id: number) {
		return http.get<ApiResponse<UserItem>>(`/user/${id}`);
	},

	createUser(payload: UserFormData) {
		return http.post<ApiResponse<UserItem>>('/user', payload);
	},

	updateUser(id: number, payload: Partial<UserFormData>) {
		return http.put<ApiResponse<UserItem>>(`/user/${id}`, payload);
	},

	deleteUser(id: number) {
		return http.delete<ApiResponse<null>>(`/user/${id}`);
	},

	sendResetPassword(id: number) {
		return http.post<ApiResponse<null>>(`/user/${id}/reset-password`);
	},

	getRoles() {
		return roleApi.getRoles();
	},

	getPermissions() {
		return permissionApi.getPermissions();
	},
};

export default userApi;
