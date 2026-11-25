import { defaultCacheStore, readCacheJson, RedisKeyHelper, writeCacheJson, type CacheStore } from '@database';
import { CmsClient, defaultCmsClient } from '@core/utils/cmsClient.js';
import type { AuthContext, ScreenAuthRecord } from '@modules/Auth/types/auth.types.js';
import { buildTrackingUrls } from '@modules/Log/index.js';
import type { CachedPlaylist, CachedPlaylistSlot, DeliveredPlaylistSlot, DeliveryFallbackResolver, DeliveryResult, TrackingUrlBuilder } from '../types/delivery.types.js';

const DEFAULT_REFRESH_SECONDS = 120;
const MAX_CACHE_TTL_SECONDS = 300;
const NEAR_CAP_REFRESH_SECONDS = 60;
const NEAR_CAP_RATIO = 0.9;
const TOKEN_GRACE_SECONDS = 300;

export interface DeliveryServiceOptions {
	store?: CacheStore;
	fallback?: DeliveryFallbackResolver;
	cmsClient?: CmsClient;
	trackingUrlBuilder?: TrackingUrlBuilder;
	nowProvider?: () => Date;
}

const createCmsDeliveryFallback = (cms: CmsClient): DeliveryFallbackResolver => ({
	fetchPlaylist: ({ screenId, venueId }) => cms.getJson<CachedPlaylist>('/delivery/playlist', { screen_id: screenId, venue_id: venueId }),
});

export class DeliveryService {
	private store: CacheStore;
	private fallback: DeliveryFallbackResolver;
	private buildTracking: TrackingUrlBuilder;
	private nowProvider: () => Date;

	constructor(options: DeliveryServiceOptions = {}) {
		this.store = options.store ?? defaultCacheStore;
		this.fallback = options.fallback ?? createCmsDeliveryFallback(options.cmsClient ?? defaultCmsClient);
		this.buildTracking = options.trackingUrlBuilder ?? ((input) => buildTrackingUrls(input));
		this.nowProvider = options.nowProvider ?? (() => new Date());
	}

	public async getPlaylist(auth: AuthContext, query: { screenCode?: string | null; venueId?: string | null }): Promise<DeliveryResult> {
		const target = await this.resolveTarget(auth, query);
		if (!target.ok) return target;

		const { screenId, venueId } = target;
		const playlistData = await this.readPlaylist(screenId, venueId);
		if (!playlistData || playlistData.playlist.length === 0) {
			return {
				ok: true,
				data: { screen_id: screenId, venue_id: venueId, orientation: playlistData?.orientation, refresh_seconds: DEFAULT_REFRESH_SECONDS, total_duration_seconds: 0, slots_count: 0, playlist: [] },
			};
		}

		const { eligibleSlots, nearCap } = await this.filterByDailyCap(playlistData.playlist);
		const baseRefresh = playlistData.refresh_seconds && playlistData.refresh_seconds > 0 ? playlistData.refresh_seconds : DEFAULT_REFRESH_SECONDS;
		const refreshSeconds = nearCap ? Math.min(baseRefresh, NEAR_CAP_REFRESH_SECONDS) : baseRefresh;
		const ttlSeconds = refreshSeconds + TOKEN_GRACE_SECONDS;

		const delivered: DeliveredPlaylistSlot[] = eligibleSlots.map((slot) => ({
			line_item_id: slot.line_item_id,
			line_item_name: slot.line_item_name,
			campaign_id: slot.campaign_id,
			creative_id: slot.creative_id,
			type: slot.type,
			media_url: slot.media_url,
			duration: slot.duration,
			tracking: this.buildTracking({ venue_id: venueId, screen_id: screenId, line_item_id: slot.line_item_id, creative_id: slot.creative_id, ttlSeconds }),
		}));

		const totalDuration = delivered.reduce((sum, s) => sum + s.duration, 0);
		return {
			ok: true,
			data: {
				screen_id: screenId,
				venue_id: venueId,
				orientation: playlistData.orientation,
				refresh_seconds: refreshSeconds,
				total_duration_seconds: totalDuration,
				slots_count: delivered.length,
				playlist: delivered,
			},
		};
	}

	private async resolveTarget(auth: AuthContext, query: { screenCode?: string | null; venueId?: string | null }): Promise<{ ok: true; screenId?: number; venueId: number } | { ok: false; code: number; message: string }> {
		if (auth.type === 'screen') {
			return { ok: true, screenId: auth.screen.screen_id, venueId: auth.screen.venue_id };
		}

		if (query.screenCode) {
			const screen = await readCacheJson<ScreenAuthRecord>(this.store, RedisKeyHelper.screenAuth(query.screenCode));
			if (!screen || screen.status !== 'active') {
				return { ok: false, code: 404, message: 'Screen not found or inactive' };
			}
			// Prevent a Vendor from accessing another Vendor's screen
			if (screen.vendor_id !== auth.vendor.vendor_id) {
				return { ok: false, code: 403, message: 'Forbidden: screen does not belong to vendor' };
			}
			return { ok: true, screenId: screen.screen_id, venueId: screen.venue_id };
		}

		const parsedVenueId = Number(query.venueId);
		if (Number.isInteger(parsedVenueId) && parsedVenueId > 0) {
			return { ok: true, venueId: parsedVenueId };
		}

		return { ok: false, code: 400, message: 'Missing required screen_code or venue_id parameter' };
	}

	private async readPlaylist(screenId: number | undefined, venueId: number): Promise<CachedPlaylist | null> {
		if (screenId) {
			const byScreen = await readCacheJson<CachedPlaylist>(this.store, RedisKeyHelper.playlistScreen(screenId));
			if (byScreen) return byScreen;
		}
		const byVenue = await readCacheJson<CachedPlaylist>(this.store, RedisKeyHelper.playlist(venueId));
		if (byVenue) return byVenue;

		if (!this.fallback.fetchPlaylist) return null;
		const fresh = await this.fallback.fetchPlaylist({ screenId, venueId });
		if (fresh) {
			const cacheKey = screenId ? RedisKeyHelper.playlistScreen(screenId) : RedisKeyHelper.playlist(venueId);
			const ttl = Math.max(DEFAULT_REFRESH_SECONDS, Math.min(MAX_CACHE_TTL_SECONDS, fresh.refresh_seconds ?? DEFAULT_REFRESH_SECONDS));
			await writeCacheJson(this.store, cacheKey, ttl, fresh);
		}
		return fresh;
	}

	private async filterByDailyCap(slots: CachedPlaylistSlot[]): Promise<{ eligibleSlots: CachedPlaylistSlot[]; nearCap: boolean }> {
		const cappedIds = [...new Set(slots.filter((s) => (s.daily_impression_cap ?? 0) > 0).map((s) => s.line_item_id))];
		if (cappedIds.length === 0 || !this.store.mget) return { eligibleSlots: slots, nearCap: false };

		const today = this.nowProvider().toISOString().slice(0, 10);
		const values = await this.store.mget(cappedIds.map((id) => RedisKeyHelper.capDaily(today, id)));

		const deliveredByLineItem = new Map<number, number>();
		cappedIds.forEach((id, idx) => {
			const count = Number(values[idx] ?? 0);
			deliveredByLineItem.set(id, Number.isFinite(count) ? count : 0);
		});

		let nearCap = false;
		const eligibleSlots = slots.filter((slot) => {
			const cap = slot.daily_impression_cap ?? 0;
			if (cap <= 0) return true;
			const delivered = deliveredByLineItem.get(slot.line_item_id) ?? 0;
			if (delivered >= cap) return false;
			if (delivered >= cap * NEAR_CAP_RATIO) nearCap = true;
			return true;
		});

		return { eligibleSlots, nearCap };
	}
}

export const defaultDeliveryService = new DeliveryService();
