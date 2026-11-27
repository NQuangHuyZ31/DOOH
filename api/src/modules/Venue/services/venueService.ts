import { CmsClient, defaultCmsClient } from '@core/utils/cmsClient.js';
import type { AuthContext } from '@modules/Auth/types/auth.types.js';
import type { BatchRegisterResult, HeartbeatPayload, HeartbeatResult, PartnerScreenPayload, PartnerScreenRecord, VenueResult } from '../types/venue.types.js';

const MAX_BATCH_SCREENS = 100;

export interface VenueServiceOptions {
	cmsClient?: CmsClient;
}

export class VenueService {
	private cmsClient: CmsClient;

	constructor(options: VenueServiceOptions = {}) {
		this.cmsClient = options.cmsClient ?? defaultCmsClient;
	}

	public async registerScreen(auth: AuthContext, payload: Partial<PartnerScreenPayload>): Promise<VenueResult<PartnerScreenRecord>> {
		if (auth.type !== 'vendor') {
			return { ok: false, code: 403, message: 'Forbidden: vendor API key required' };
		}

		const validationError = this.validateSinglePayload(payload);
		if (validationError) {
			return { ok: false, code: 422, message: validationError };
		}

		const res = await this.cmsClient.postJson<PartnerScreenRecord>('/venue/screens', {
			...payload,
			vendor_id: auth.vendor.vendor_id,
		});

		if (!res.ok) {
			return { ok: false, code: res.status, message: res.message, errors: res.errors };
		}

		return { ok: true, status: 201, data: res.data };
	}

	public async registerScreensBatch(auth: AuthContext, screens: unknown): Promise<VenueResult<BatchRegisterResult>> {
		if (auth.type !== 'vendor') {
			return { ok: false, code: 403, message: 'Forbidden: vendor API key required' };
		}

		if (!Array.isArray(screens) || screens.length === 0) {
			return { ok: false, code: 422, message: 'screens must be a non-empty array' };
		}

		if (screens.length > MAX_BATCH_SCREENS) {
			return { ok: false, code: 422, message: `Batch size cannot exceed ${MAX_BATCH_SCREENS} screens` };
		}

		const res = await this.cmsClient.postJson<BatchRegisterResult>('/venue/screens/batch', {
			vendor_id: auth.vendor.vendor_id,
			screens,
		});

		if (!res.ok) {
			return { ok: false, code: res.status, message: res.message, errors: res.errors };
		}

		return { ok: true, status: 200, data: res.data };
	}

	public async listScreens(auth: AuthContext): Promise<VenueResult<PartnerScreenRecord[]>> {
		if (auth.type !== 'vendor') {
			return { ok: false, code: 403, message: 'Forbidden: vendor API key required' };
		}

		const screens = await this.cmsClient.getJson<PartnerScreenRecord[]>('/venue/screens', {
			vendor_id: auth.vendor.vendor_id,
		});

		if (!screens) {
			return { ok: false, code: 502, message: 'Failed to retrieve screens from upstream CMS' };
		}

		return { ok: true, status: 200, data: screens };
	}

	public async getScreenConfig(auth: AuthContext, screenCode: string): Promise<VenueResult<PartnerScreenRecord>> {
		if (auth.type !== 'screen') {
			return { ok: false, code: 403, message: 'Forbidden: screen key required' };
		}

		const code = screenCode.trim().toUpperCase();
		if (code !== auth.screen.code.toUpperCase()) {
			return { ok: false, code: 403, message: 'Forbidden: screen code mismatch' };
		}

		const config = await this.cmsClient.getJson<PartnerScreenRecord>('/venue/screens/config', { code });
		if (!config) {
			return { ok: false, code: 404, message: 'Screen config not found' };
		}

		return { ok: true, status: 200, data: config };
	}

	public async recordHeartbeat(auth: AuthContext, screenCode: string, payload: HeartbeatPayload): Promise<VenueResult<HeartbeatResult>> {
		if (auth.type !== 'screen') {
			return { ok: false, code: 403, message: 'Forbidden: screen key required' };
		}

		const code = screenCode.trim().toUpperCase();
		if (code !== auth.screen.code.toUpperCase()) {
			return { ok: false, code: 403, message: 'Forbidden: screen code mismatch' };
		}

		const res = await this.cmsClient.postJson<HeartbeatResult>('/venue/screens/heartbeat', {
			code,
			player_app_version: payload.player_app_version,
			ip_address: payload.ip_address,
			storage_free_mb: payload.storage_free_mb,
		});

		if (!res.ok) {
			return { ok: false, code: res.status, message: res.message, errors: res.errors };
		}

		return { ok: true, status: 200, data: res.data };
	}

	private validateSinglePayload(payload: Partial<PartnerScreenPayload>): string | null {
		if (!payload.name || typeof payload.name !== 'string' || payload.name.trim() === '') return 'name is required';
		if (!payload.location_name || typeof payload.location_name !== 'string' || payload.location_name.trim() === '') return 'location_name is required';
		if (!payload.city || typeof payload.city !== 'string' || payload.city.trim() === '') return 'city is required';
		if (typeof payload.resolution_width !== 'number' || !Number.isInteger(payload.resolution_width) || payload.resolution_width < 100 || payload.resolution_width > 16384) {
			return 'resolution_width must be an integer between 100 and 16384';
		}
		if (typeof payload.resolution_height !== 'number' || !Number.isInteger(payload.resolution_height) || payload.resolution_height < 100 || payload.resolution_height > 16384) {
			return 'resolution_height must be an integer between 100 and 16384';
		}
		return null;
	}
}

export const defaultVenueService = new VenueService();
