export interface PartnerScreenPayload {
	name: string;
	location_name: string;
	city: string;
	resolution_width: number;
	resolution_height: number;
	screen_type?: string;
	sub_location?: string;
	has_audio?: boolean;
	loop_duration_seconds?: number;
	default_slot_seconds?: number;
	hardware_device_uid?: string;
}

export interface PartnerScreenRecord {
	code: string;
	secret_key?: string;
	name: string;
	location_name: string | null;
	city: string | null;
	sub_location?: string | null;
	screen_type: string;
	resolution_width: number;
	resolution_height: number;
	orientation: string;
	aspect_ratio: string;
	has_audio: boolean;
	loop_duration_seconds: number;
	default_slot_seconds: number;
	hardware_device_uid?: string | null;
	connectivity_status?: string | null;
	last_heartbeat_at?: string | null;
	status: string;
}

export interface BatchRegisterScreenCreated extends PartnerScreenRecord {
	index: number;
}

export interface BatchRegisterScreenFailed {
	index: number;
	hardware_device_uid?: string | null;
	name?: string | null;
	error: string;
}

export interface BatchRegisterResult {
	total: number;
	created_count: number;
	failed_count: number;
	created: BatchRegisterScreenCreated[];
	failed: BatchRegisterScreenFailed[];
}

export interface HeartbeatPayload {
	player_app_version?: string;
	ip_address?: string;
	storage_free_mb?: number;
}

export interface HeartbeatResult {
	code: string;
	connectivity_status: string;
	last_heartbeat_at: string | null;
}

export type VenueResult<T> =
	| { ok: true; status: number; data: T }
	| { ok: false; code: number; message: string; errors?: Record<string, string[]> };
