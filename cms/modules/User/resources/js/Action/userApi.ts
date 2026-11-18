import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { PermissionItem, RoleItem, UserFilterParams, UserFormData, UserItem } from '../types/user';

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

	getRoles() {
		return http.get<ApiResponse<RoleItem[]>>('/user/roles');
	},

	getPermissions() {
		return http.get<ApiResponse<PermissionItem[]>>('/user/permissions');
	},
};

export default userApi;
