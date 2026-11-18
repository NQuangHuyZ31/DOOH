export interface PermissionItem {
	id: number;
	name: string;
	module: string;
	display_name: string;
	description?: string;
}

export interface RoleItem {
	id: number;
	name: string;
	display_name: string;
	description?: string;
	permissions?: PermissionItem[];
	users_count?: number;
}

export interface RoleFormData {
	name: string;
	display_name: string;
	description?: string;
	permissions?: number[];
}
