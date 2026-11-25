import type { TrackingUrlInput, TrackingUrls } from '@modules/Log/utils/trackingUrlUtil.js';

export interface CachedPlaylistSlot {
	line_item_id: number;
	line_item_name?: string;
	campaign_id?: number;
	creative_id?: number;
	priority?: number;
	type: string;
	media_url: string;
	duration: number;
	daily_impression_cap?: number;
}

export interface CachedPlaylist {
	screen_id?: number;
	venue_id?: number;
	orientation?: string;
	refresh_seconds?: number;
	playlist: CachedPlaylistSlot[];
}

export interface DeliveredPlaylistSlot {
	line_item_id: number;
	line_item_name?: string;
	campaign_id?: number;
	creative_id?: number;
	type: string;
	media_url: string;
	duration: number;
	tracking: TrackingUrls;
}

export interface DeliveryPlaylistResponse {
	screen_id?: number;
	venue_id: number;
	orientation?: string;
	refresh_seconds: number;
	total_duration_seconds: number;
	slots_count: number;
	playlist: DeliveredPlaylistSlot[];
}

export type DeliveryResult = { ok: true; data: DeliveryPlaylistResponse } | { ok: false; code: number; message: string };

export interface DeliveryFallbackResolver {
	fetchPlaylist?: (target: { screenId?: number; venueId: number }) => Promise<CachedPlaylist | null>;
}

export type TrackingUrlBuilder = (input: TrackingUrlInput) => TrackingUrls;
