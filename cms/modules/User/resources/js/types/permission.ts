export interface PermissionItem {
	id: number;
	name: string;
	module: string;
	display_name: string;
	description?: string;
	roles_count?: number;
	created_at?: string;
	updated_at?: string;
}

export interface PermissionFormData {
	name: string;
	module: string;
	display_name: string;
	description?: string;
}

export interface PermissionFilterParams {
	search?: string;
	module?: string;
}
