export interface VenueItem {
	id: number;
	code: string;
	name: string;
	venue_type?: string;
	media_owner_id?: number | null;
	address?: string;
	ward?: string;
	district?: string;
	city_province?: string;
	country_code?: string;
	latitude?: number | null;
	longitude?: number | null;
	opening_time?: string;
	closing_time?: string;
	is_24_7?: boolean;
	daily_traffic?: number;
	contact_name?: string;
	contact_phone?: string;
	status: 'active' | 'inactive' | 'maintenance';
	screens_count?: number;
	created_at?: string;
	updated_at?: string;
}

export interface ScreenItem {
	id: number;
	venue_id: number;
	code: string;
	name: string;
	sub_location?: string;
	screen_type?: string;
	resolution_width: number;
	resolution_height: number;
	orientation: 'landscape' | 'portrait' | 'custom';
	aspect_ratio?: string;
	physical_width_m?: number | null;
	physical_height_m?: number | null;
	pixel_pitch_mm?: number | null;
	brightness_nits?: number | null;
	has_audio?: boolean;
	loop_duration_seconds?: number;
	default_slot_seconds?: number;
	hardware_device_uid?: string;
	secret_key?: string;
	connectivity_status: 'online' | 'offline' | 'degraded';
	last_heartbeat_at?: string | null;
	player_app_version?: string;
	ip_address?: string;
	storage_free_mb?: number | null;
	status: 'active' | 'inactive' | 'maintenance';
	venue?: {
		id: number;
		name: string;
		code: string;
		city_province?: string;
		venue_type?: string;
	};
	created_at?: string;
	updated_at?: string;
}

export interface VenueQueryParams {
	page?: number;
	per_page?: number;
	search?: string;
	venue_type?: string;
	city_province?: string;
	status?: string;
}

export interface ScreenQueryParams {
	page?: number;
	per_page?: number;
	search?: string;
	venue_id?: number;
	screen_type?: string;
	orientation?: string;
	connectivity_status?: string;
	status?: string;
}
