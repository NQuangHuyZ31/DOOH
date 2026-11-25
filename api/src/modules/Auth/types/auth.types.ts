export interface VendorAuthRecord {
	vendor_id: number;
	name: string;
	status: 'active' | 'inactive' | 'suspended';
	rate_limit_per_min?: number;
}

export interface ScreenAuthRecord {
	screen_id: number;
	venue_id: number;
	vendor_id: number;
	code: string;
	secret_key: string;
	status: 'active' | 'inactive' | 'maintenance';
}

export type AuthContext =
	| { type: 'vendor'; vendor: VendorAuthRecord }
	| { type: 'screen'; screen: ScreenAuthRecord };

export type AuthResult =
	| { ok: true; auth: AuthContext }
	| { ok: false; code: number; message: string };

export type SignatureVerifyResult =
	| { ok: true }
	| { ok: false; code: number; message: string };

export type AuthPolicy = 'public' | 'vendor' | 'screen' | 'screen_or_vendor';

export interface AuthRouteRule {
	prefix: string;
	exact?: boolean;
	policy: AuthPolicy;
}

export interface AuthCacheStore {
	get(key: string): Promise<string | null>;
}

export interface AuthFallbackResolver {
	resolveVendor?: (apiKeyHash: string) => Promise<VendorAuthRecord | null>;
	resolveScreen?: (screenCode: string, screenKey: string) => Promise<ScreenAuthRecord | null>;
}
