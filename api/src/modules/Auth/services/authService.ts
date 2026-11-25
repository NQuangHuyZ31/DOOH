import { getRedisClient, RedisKeyHelper } from '../../../../database/index.js';
import { config } from '../../Core/config/config.js';
import type { AuthCacheStore, AuthFallbackResolver, AuthResult, ScreenAuthRecord, SignatureVerifyResult, VendorAuthRecord } from '../types/auth.types.js';
import { sha256Hex, verifyKeyMatch, verifyPayload, verifyScopedKey } from '../utils/hmacUtil.js';

export interface AuthServiceOptions {
	store?: AuthCacheStore;
	masterSecret?: string;
	fallback?: AuthFallbackResolver;
	hmacMaxSkewSeconds?: number;
}

const defaultRedisStore: AuthCacheStore = {
	get: async (key: string): Promise<string | null> => {
		const client = getRedisClient();
		if (client.status === 'wait') {
			await client.connect().catch(() => {});
		}
		if (client.status !== 'ready') return null;
		return client.get(key);
	},
};

export class AuthService {
	private store: AuthCacheStore;
	private masterSecret?: string;
	private fallback?: AuthFallbackResolver;
	private maxSkewSeconds: number;

	constructor(options: AuthServiceOptions = {}) {
		this.store = options.store ?? defaultRedisStore;
		this.masterSecret = options.masterSecret;
		this.fallback = options.fallback;
		this.maxSkewSeconds = options.hmacMaxSkewSeconds ?? config.hmacMaxSkewSeconds;
	}

	public async authenticateVendor(apiKey: string | null): Promise<AuthResult> {
		if (!apiKey || !apiKey.startsWith('dooh_')) {
			return { ok: false, code: 401, message: 'Unauthorized: invalid or missing API key' };
		}

		const keyHash = sha256Hex(apiKey);
		const record = await this.readCacheJson<VendorAuthRecord>(RedisKeyHelper.vendorAuth(keyHash))
			?? (this.fallback?.resolveVendor ? await this.fallback.resolveVendor(keyHash) : null);

		if (!record || record.status !== 'active') {
			return { ok: false, code: 401, message: 'Unauthorized: API key is invalid or inactive' };
		}

		return { ok: true, auth: { type: 'vendor', vendor: record } };
	}

	public async authenticateScreen(screenKey: string | null, screenCode: string | null): Promise<AuthResult> {
		if (!screenKey || !screenCode) {
			return { ok: false, code: 401, message: 'Unauthorized: missing screen key or screen code' };
		}

		// Layer 1: stateless HMAC verification blocks forged keys before touching Redis
		if (!verifyScopedKey(screenKey, 'screen', screenCode, this.masterSecret)) {
			return { ok: false, code: 401, message: 'Unauthorized: invalid screen key signature' };
		}

		// Layer 2: Redis cache lookup verifies active status and catches rotated/revoked keys
		const record = await this.readCacheJson<ScreenAuthRecord>(RedisKeyHelper.screenAuth(screenCode))
			?? (this.fallback?.resolveScreen ? await this.fallback.resolveScreen(screenCode, screenKey) : null);

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

	private async readCacheJson<T>(key: string): Promise<T | null> {
		try {
			const raw = await this.store.get(key);
			if (!raw) return null;
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}
}

export const defaultAuthService = new AuthService();
