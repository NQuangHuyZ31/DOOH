import { config, normalizePathPrefix } from '../config/config.js';

export interface CmsClientOptions {
	baseUrl?: string;
	internalPrefix?: string;
	internalSecret?: string;
	timeoutMs?: number;
}

interface CmsEnvelope<T> {
	status: string;
	data?: T;
}

export class CmsClient {
	private baseUrl: string;
	private internalPrefix: string;
	private internalSecret: string;
	private timeoutMs: number;
	private inFlight = new Map<string, Promise<unknown>>();

	constructor(options: CmsClientOptions = {}) {
		this.baseUrl = (options.baseUrl ?? config.cms.baseUrl).replace(/\/+$/, '');
		this.internalPrefix = normalizePathPrefix(options.internalPrefix ?? config.cms.internalPrefix);
		this.internalSecret = options.internalSecret ?? config.cms.internalSecret;
		this.timeoutMs = options.timeoutMs ?? config.cms.timeoutMs;
	}

	public isConfigured(): boolean {
		return this.baseUrl.length > 0 && this.internalSecret.length > 0;
	}

	public async getJson<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<T | null> {
		if (!this.isConfigured()) return null;

		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(query)) {
			if (v !== undefined && v !== '') params.set(k, String(v));
		}
		const cleanPath = '/' + path.replace(/^\/+/, '');
		const qs = params.toString();
		const url = `${this.baseUrl}${this.internalPrefix}${cleanPath}${qs ? `?${qs}` : ''}`;

		// Deduplicate concurrent cache-miss fetches for the same URL (anti-stampede)
		const existing = this.inFlight.get(url);
		if (existing) return existing as Promise<T | null>;

		const requestPromise = this.fetchOnce<T>(url).finally(() => {
			this.inFlight.delete(url);
		});
		this.inFlight.set(url, requestPromise);

		return requestPromise;
	}

	private async fetchOnce<T>(url: string): Promise<T | null> {
		try {
			const res = await fetch(url, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					'X-INTERNAL-SECRET': this.internalSecret,
				},
				signal: AbortSignal.timeout(this.timeoutMs),
			});

			if (!res.ok) return null;
			const body = (await res.json()) as CmsEnvelope<T>;
			return body.status === 'success' && body.data !== undefined ? body.data : null;
		} catch {
			return null;
		}
	}
}

export const defaultCmsClient = new CmsClient();
