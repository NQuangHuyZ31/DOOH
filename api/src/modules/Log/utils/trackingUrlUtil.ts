import { config, normalizePathPrefix } from '#core/config/config.js';
import { encryptToken } from '#core/utils/tokenCrypto.js';

export interface TrackingUrlInput {
	venue_id: number;
	screen_id?: number;
	line_item_id: number;
	creative_id?: number;
	ttlSeconds: number;
}

export interface TrackingUrls {
	impression_url: string;
	complete_url: string;
}

export interface TrackingUrlOptions {
	appUrl?: string;
	apiPrefix?: string;
	appKey?: string;
}

export const buildTrackingUrls = (input: TrackingUrlInput, options: TrackingUrlOptions = {}): TrackingUrls => {
	const exp = Math.floor(Date.now() / 1000) + Math.max(60, input.ttlSeconds);
	const hash = encryptToken({ venue_id: input.venue_id, screen_id: input.screen_id, line_item_id: input.line_item_id, creative_id: input.creative_id, exp }, options.appKey);

	const baseUrl = (options.appUrl ?? config.appUrl).replace(/\/+$/, '');
	const prefix = normalizePathPrefix(options.apiPrefix ?? config.apiPrefix);
	const logBase = `${baseUrl}${prefix}/log`;

	return {
		impression_url: `${logBase}/imp/${hash}`,
		complete_url: `${logBase}/complete/${hash}`,
	};
};
