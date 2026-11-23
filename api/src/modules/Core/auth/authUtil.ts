import type { IncomingMessage } from 'node:http';
import crypto from 'node:crypto';

export const extractApiKey = (req: IncomingMessage): string | null => {
	const headerKey = req.headers['x-dooh-api-key'];
	if (typeof headerKey === 'string' && headerKey.trim()) {
		return headerKey.trim();
	}

	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authHeader.substring(7).trim();
	}

	return null;
};

export const verifyScreenHmac = (secretKey: string, code: string, signature: string): boolean => {
	try {
		const expected = crypto.createHmac('sha256', secretKey).update(code.toUpperCase()).digest('hex');
		return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
	} catch {
		return false;
	}
};
