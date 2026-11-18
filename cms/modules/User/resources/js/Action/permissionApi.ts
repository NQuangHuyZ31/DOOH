import http from '@core/Action/api';
import type { ApiResponse, PaginatedResponse } from '@core/types/api';
import type { PermissionFormData, PermissionItem } from '../types/permission';

export const permissionApi = {
	getPermissions(params?: {
		paginate?: boolean;
		per_page?: number;
		page?: number;
		search?: string;
		module?: string;
		grouped?: boolean;
	}) {
		return http.get<ApiResponse<PermissionItem[]> | PaginatedResponse<PermissionItem>>('/user/permission', {
			params,
		});
	},

	getPermission(id: number) {
		return http.get<ApiResponse<PermissionItem>>(`/user/permission/${id}`);
	},

	createPermission(payload: PermissionFormData) {
		return http.post<ApiResponse<PermissionItem>>('/user/permission', payload);
	},

	updatePermission(id: number, payload: Partial<PermissionFormData>) {
		return http.put<ApiResponse<PermissionItem>>(`/user/permission/${id}`, payload);
	},

	deletePermission(id: number) {
		return http.delete<ApiResponse<null>>(`/user/permission/${id}`);
	},
};

export default permissionApi;
