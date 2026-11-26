export interface SimulatorTrackingUrls {
	impression_url: string;
	complete_url: string;
}

export interface SimulatorSlot {
	line_item_id: number;
	line_item_name?: string;
	campaign_id?: number;
	creative_id?: number;
	type: 'video' | 'image' | 'html5' | 'vast';
	media_url: string;
	duration: number;
	tracking?: SimulatorTrackingUrls;
}

export interface CreateLocalScreenPayload {
	name: string;
	location_name: string;
	city: string;
	sub_location?: string;
	screen_type?: string;
	resolution_width: number;
	resolution_height: number;
	has_audio?: boolean;
	loop_duration_seconds?: number;
	default_slot_seconds?: number;
	hardware_device_uid?: string;
}

export interface SimulatorScreenItem {
	id: number;
	name: string;
	location_name: string;
	city: string;
	sub_location?: string | null;
	screen_type: string;
	resolution_width: number;
	resolution_height: number;
	orientation: string;
	aspect_ratio: string | null;
	has_audio: boolean;
	loop_duration_seconds: number;
	default_slot_seconds: number;
	hardware_device_uid?: string | null;
	sync_status: 'unsynced' | 'synced';
	code: string | null;
	secret_key: string | null;
	node_api_url: string;
	synced_at?: string | null;
	created_at?: string | null;
}

export interface BatchSyncFailedItem {
	index: number;
	hardware_device_uid?: string | null;
	name?: string | null;
	error: string;
}

export interface BatchSyncResult {
	total: number;
	synced_count: number;
	failed_count: number;
	synced: SimulatorScreenItem[];
	failed: BatchSyncFailedItem[];
}

export interface SimulatorScreenMeta {
	id: number;
	code: string;
	name: string;
	secret_key?: string;
	resolution_width: number;
	resolution_height: number;
	orientation: string;
	aspect_ratio: string;
	has_audio: boolean;
	loop_duration_seconds: number;
	default_slot_seconds: number;
	status: string;
}

export interface SimulatorPlaylistData {
	source: 'node_api';
	screen: SimulatorScreenMeta;
	screen_id?: number;
	venue_id?: number;
	refresh_seconds: number;
	total_duration_seconds: number;
	slots_count: number;
	playlist: SimulatorSlot[];
}

export interface ParsedVastResult {
	primary_media_url?: string;
	duration_seconds?: number;
	impressions?: string[];
	tracking_events?: Record<string, string[]>;
}

export interface BeaconLogEntry {
	id: string;
	timestamp: string;
	event: 'IMP' | 'COMPLETE' | 'VAST_IMP' | 'VAST_COMPLETE' | 'SKIP' | 'CMS_SYNC' | 'NODE_PLAYLIST' | 'HEARTBEAT';
	lineItemId?: number;
	lineItemName?: string;
	url?: string;
	statusCode: number | 'OFFLINE' | 'ERR' | 'OK';
	latencyMs: number;
	detail?: string;
}
