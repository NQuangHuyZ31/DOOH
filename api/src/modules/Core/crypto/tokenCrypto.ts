import crypto from 'node:crypto';
import { config } from '../config/config.js';

export interface TrackingTokenPayload {
	venue_id: number | string;
	line_item_id: number;
	exp?: number;
	[key: string]: unknown;
}

const getKeyBuffer = (customKeyHex?: string): Buffer => {
	const raw = customKeyHex || config.appKey;
	if (raw.length === 64) return Buffer.from(raw, 'hex');
	return crypto.createHash('sha256').update(raw).digest();
};

export const encryptToken = (payload: TrackingTokenPayload, customKeyHex?: string): string => {
	const key = getKeyBuffer(customKeyHex);
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

	const json = JSON.stringify(payload);
	const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();

	const combined = Buffer.concat([iv, tag, encrypted]);
	return combined.toString('base64url');
};

export const decryptToken = <T extends TrackingTokenPayload = TrackingTokenPayload>(hash: string, customKeyHex?: string): T | null => {
	try {
		const combined = Buffer.from(hash, 'base64url');
		if (combined.length < 28) return null; // 12 IV + 16 TAG minimum

		const iv = combined.subarray(0, 12);
		const tag = combined.subarray(12, 28);
		const ciphertext = combined.subarray(28);

		const key = getKeyBuffer(customKeyHex);
		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);

		const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		const parsed = JSON.parse(decrypted.toString('utf8')) as T;

		if (parsed.exp && Math.floor(Date.now() / 1000) > parsed.exp) {
			return null; // Token expired
		}

		return parsed;
	} catch {
		return null;
	}
};
