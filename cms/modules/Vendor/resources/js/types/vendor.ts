export interface VendorItem {
	id: number;
	code: string;
	name: string;
	company_name?: string | null;
	tax_code?: string | null;
	contact_name?: string | null;
	contact_email?: string | null;
	contact_phone?: string | null;
	address?: string | null;
	user_id?: number | null;
	user?: {
		id: number;
		name: string;
		email: string;
	} | null;
	api_key_prefix?: string | null;
	has_api_key?: boolean;
	rate_limit_per_minute: number;
	revenue_share_percentage: number;
	status: 'active' | 'inactive' | 'suspended';
	create_user?: boolean;
	user_name?: string;
	user_email?: string;
	user_password?: string;
	last_active_at?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface VendorQueryParams {
	search?: string;
	status?: string;
	user_id?: number;
	page?: number;
	per_page?: number;
}

export interface CreateVendorResponse {
	vendor: VendorItem;
	plain_api_key: string;
}

export interface RegenerateApiKeyResponse {
	vendor: VendorItem;
	plain_api_key: string;
}
