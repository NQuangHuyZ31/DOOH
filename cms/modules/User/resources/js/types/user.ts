export interface RoleItem {
	id: number;
	name: string;
	display_name: string;
	description?: string;
}

export interface PermissionItem {
	id: number;
	name: string;
	module: string;
	display_name: string;
	description?: string;
}

export interface UserItem {
	id: number;
	name: string;
	email: string;
	role_id?: number | null;
	role?: RoleItem | string | null;
	roles?: string[];
	permission_type: 'role' | 'direct';
	direct_permissions?: string[];
	permissions?: string[];
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
