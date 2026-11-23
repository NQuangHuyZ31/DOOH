export interface CampaignItem {
	id: number;
	code: string;
	name: string;
	description?: string | null;
	total_budget?: number | null;
	start_date: string;
	end_date: string;
	status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
	user?: {
		id: number;
		name: string;
		email: string;
	} | null;
	line_items_count?: number;
	created_at?: string;
	updated_at?: string;
}

export interface LineItemVenueItem {
	id: number;
	name: string;
	code: string;
}

export interface LineItemScreenItem {
	id: number;
	venue_id: number;
	name: string;
	code: string;
	orientation: 'landscape' | 'portrait' | 'custom';
	resolution_width?: number;
	resolution_height?: number;
}

export interface LineItemCreativeItem {
	id: number;
	name: string;
	code?: string;
	type: string;
	status?: string;
	media_url: string;
	width?: number;
	height?: number;
	duration_seconds?: number | null;
	weight?: number;
}

export interface LineItem {
	id: number;
	campaign_id: number;
	creative_id?: number | null;
	code: string;
	name: string;
	priority: number;
	pacing_mode: 'evenly' | 'asap';
	orientation: 'landscape' | 'portrait' | 'custom';
	start_date: string;
	end_date: string;
	target_impressions: number;
	daily_impression_cap: number;
	status: 'draft' | 'active' | 'paused' | 'completed';
	campaign?: {
		id: number;
		name: string;
		code: string;
		status: string;
	} | null;
	creative?: {
		id: number;
		name: string;
		code: string;
		type: string;
		media_url: string;
		duration_seconds?: number | null;
	} | null;
	creatives?: LineItemCreativeItem[];
	venues?: LineItemVenueItem[];
	screens?: LineItemScreenItem[];
	created_at?: string;
	updated_at?: string;
}

export interface PlaylistSlotItem {
	line_item_id: number;
	line_item_name: string;
	campaign_id: number;
	priority: number;
	type: string;
	media_url: string;
	duration: number;
	tracking: {
		impression_url: string;
		complete_url: string;
	};
}

export interface PlaylistPreviewData {
	screen_id?: number;
	venue_id?: number;
	orientation?: string;
	refresh_seconds: number;
	total_duration_seconds: number;
	slots_count: number;
	playlist: PlaylistSlotItem[];
}

export interface DeliveryQueryParams {
	search?: string;
	campaign_id?: number;
	status?: string;
	pacing_mode?: string;
	page?: number;
	per_page?: number;
}
