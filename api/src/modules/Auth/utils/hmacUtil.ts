import type { IncomingMessage } from 'node:http';
import crypto from 'node:crypto';
import { config } from '#core/config/config.js';

export const resolveMasterSecret = (customSecret?: string): Buffer | string => {
	const raw = customSecret && customSecret.length > 0 ? customSecret : config.screenMasterSecret;
	if (raw.startsWith('base64:')) {
		const decoded = Buffer.from(raw.slice(7), 'base64');
		if (decoded.length > 0) return decoded;
	}
	return raw;
};

export const sha256Hex = (value: string): string => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

export const verifyKeyMatch = (providedKey: string, storedKey: string): boolean => {
	const a = Buffer.from(providedKey, 'utf8');
	const b = Buffer.from(storedKey, 'utf8');
	if (a.length !== b.length || a.length === 0) return false;
	return crypto.timingSafeEqual(a, b);
};

export const verifyScopedKey = (key: string, scope: string, identifier: string, customSecret?: string, nonceBytes = 16, signatureLength = 32): boolean => {
	const nonceLength = nonceBytes * 2;
	if (key.length !== nonceLength + signatureLength || !/^[0-9a-f]+$/i.test(key)) {
		return false;
	}

	const secret = resolveMasterSecret(customSecret);
	if (secret.length === 0) return false;
	const nonce = key.slice(0, nonceLength).toLowerCase();
	const signature = key.slice(nonceLength, nonceLength + signatureLength).toLowerCase();
	const expected = crypto.createHmac('sha256', secret).update(`${scope}:${identifier}:${nonce}`).digest('hex').slice(0, signatureLength);

	return verifyKeyMatch(signature, expected);
};

export const verifyPayload = (data: string | Record<string, unknown>, signature: string, secretKey: string | Buffer, algo = 'sha256'): boolean => {
	const payload = typeof data === 'string' ? data : JSON.stringify(data);
	const expected = crypto.createHmac(algo, secretKey).update(payload, 'utf8').digest('hex');
	return verifyKeyMatch(signature.toLowerCase(), expected);
};

export const extractHeader = (req: IncomingMessage, name: string): string | null => {
	const val = req.headers[name.toLowerCase()];
	if (typeof val === 'string' && val.trim().length > 0) return val.trim();
	return null;
};

export const extractApiKey = (req: IncomingMessage): string | null => extractHeader(req, 'x-dooh-api-key');

export const extractScreenKey = (req: IncomingMessage): string | null => extractHeader(req, 'x-dooh-screen-key');

export const extractSignatureHeaders = (req: IncomingMessage): { signature: string | null; timestamp: string | null } => ({
	signature: extractHeader(req, 'x-dooh-signature'),
	timestamp: extractHeader(req, 'x-dooh-timestamp'),
});
