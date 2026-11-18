import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { RoleFormData, RoleItem } from '../types/role';

export const roleApi = {
	getRoles(params?: { paginate?: boolean; per_page?: number; page?: number; search?: string }) {
		return http.get<ApiResponse<RoleItem[]> | PaginatedResponse<RoleItem>>('/user/role', { params });
	},

	getRole(id: number) {
		return http.get<ApiResponse<RoleItem>>(`/user/role/${id}`);
	},

	createRole(payload: RoleFormData) {
		return http.post<ApiResponse<RoleItem>>('/user/role', payload);
	},

	updateRole(id: number, payload: Partial<RoleFormData>) {
		return http.put<ApiResponse<RoleItem>>(`/user/role/${id}`, payload);
	},

	deleteRole(id: number) {
		return http.delete<ApiResponse<null>>(`/user/role/${id}`);
	},
};

export default roleApi;
