import type { PermissionItem, RoleItem } from './role';

export type { PermissionItem, RoleItem };

export interface UserItem {
	id: number;
	name: string;
	email: string;
	role_id?: number | null;
	role?: RoleItem | string | null;
	roles?: string[];
	permission_type: 'role' | 'direct';
	direct_permissions?: (string | PermissionItem)[];
	permissions?: (string | PermissionItem)[];
	created_at?: string;
}

export interface UserFormData {
	name: string;
	email: string;
	password?: string;
	role_id?: number;
	permission_type: 'role' | 'direct';
	direct_permissions?: string[];
}

export interface UserFilterParams {
	search?: string;
	role?: string;
	permission_type?: string;
	page?: number;
	per_page?: number;
}
