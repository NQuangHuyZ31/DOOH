import { defaultCacheStore, readCacheJson, RedisKeyHelper, writeCacheJson, type CacheStore } from '#database';
import { config } from '#core/config/config.js';
import { CmsClient, defaultCmsClient } from '#core/utils/cmsClient.js';
import type { AuthFallbackResolver, AuthResult, ScreenAuthRecord, SignatureVerifyResult, VendorAuthRecord } from '../types/auth.types.js';
import { sha256Hex, verifyKeyMatch, verifyPayload, verifyScopedKey } from '../utils/hmacUtil.js';

const AUTH_CACHE_TTL_SECONDS = 300;

export interface AuthServiceOptions {
	store?: CacheStore;
	masterSecret?: string;
	fallback?: AuthFallbackResolver;
	cmsClient?: CmsClient;
	hmacMaxSkewSeconds?: number;
}

const createCmsAuthFallback = (cms: CmsClient): AuthFallbackResolver => ({
	resolveVendor: (keyHash: string) => cms.getJson<VendorAuthRecord>('/auth/vendor', { key_hash: keyHash }),
	resolveScreen: (screenCode: string) => cms.getJson<ScreenAuthRecord>('/auth/screen', { code: screenCode }),
});

export class AuthService {
	private store: CacheStore;
	private masterSecret?: string;
	private fallback: AuthFallbackResolver;
	private maxSkewSeconds: number;

	constructor(options: AuthServiceOptions = {}) {
		this.store = options.store ?? defaultCacheStore;
		this.masterSecret = options.masterSecret;
		this.fallback = options.fallback ?? createCmsAuthFallback(options.cmsClient ?? defaultCmsClient);
		this.maxSkewSeconds = options.hmacMaxSkewSeconds ?? config.hmacMaxSkewSeconds;
	}

	public async authenticateVendor(apiKey: string | null): Promise<AuthResult> {
		if (!apiKey || !apiKey.startsWith('dooh_')) {
			return { ok: false, code: 401, message: 'Unauthorized: invalid or missing API key' };
		}

		const keyHash = sha256Hex(apiKey);
		const cacheKey = RedisKeyHelper.vendorAuth(keyHash);
		let record = await readCacheJson<VendorAuthRecord>(this.store, cacheKey);

		if (!record && this.fallback.resolveVendor) {
			record = await this.fallback.resolveVendor(keyHash);
			if (record) await writeCacheJson(this.store, cacheKey, AUTH_CACHE_TTL_SECONDS, record);
		}

		if (!record || record.status !== 'active') {
			return { ok: false, code: 401, message: 'Unauthorized: API key is invalid or inactive' };
		}

		return { ok: true, auth: { type: 'vendor', vendor: record } };
	}

	public async authenticateScreen(screenKey: string | null, screenCode: string | null): Promise<AuthResult> {
		if (!screenKey || !screenCode) {
			return { ok: false, code: 401, message: 'Unauthorized: missing screen key or screen code' };
		}

		// Layer 1: stateless HMAC verification blocks forged keys before touching Redis or CMS
		if (!verifyScopedKey(screenKey, 'screen', screenCode, this.masterSecret)) {
			return { ok: false, code: 401, message: 'Unauthorized: invalid screen key signature' };
		}

		// Layer 2: Redis cache lookup; Layer 3: fallback to CMS and warm Redis on cache miss
		const cacheKey = RedisKeyHelper.screenAuth(screenCode);
		let record = await readCacheJson<ScreenAuthRecord>(this.store, cacheKey);

		if (!record && this.fallback.resolveScreen) {
			record = await this.fallback.resolveScreen(screenCode, screenKey);
			if (record) await writeCacheJson(this.store, cacheKey, AUTH_CACHE_TTL_SECONDS, record);
		}

		if (!record || record.status !== 'active' || !verifyKeyMatch(screenKey, record.secret_key)) {
			return { ok: false, code: 401, message: 'Unauthorized: screen key is inactive or revoked' };
		}

		return { ok: true, auth: { type: 'screen', screen: record } };
	}

	public verifyRequestSignature(payload: string, signature: string | null, timestamp: string | null, secretKey: string): SignatureVerifyResult {
		if (!signature || !timestamp) {
			return { ok: false, code: 401, message: 'Unauthorized: missing signature headers' };
		}

		const ts = Number(timestamp);
		const now = Math.floor(Date.now() / 1000);
		if (!Number.isFinite(ts) || Math.abs(now - ts) > this.maxSkewSeconds) {
			return { ok: false, code: 401, message: 'Unauthorized: request signature expired' };
		}

		if (!verifyPayload(`${timestamp}.${payload}`, signature, secretKey)) {
			return { ok: false, code: 401, message: 'Unauthorized: invalid request signature' };
		}

		return { ok: true };
	}
}

export const defaultAuthService = new AuthService();
