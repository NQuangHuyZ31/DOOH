import http from '@core/Action/api';
import type { ApiResponse } from '@core/types/api';
import type { PermissionItem } from '../types/role';

export const permissionApi = {
	getPermissions(params?: { grouped?: boolean }) {
		return http.get<ApiResponse<PermissionItem[]>>('/user/permission', { params });
	},
};

export default permissionApi;
