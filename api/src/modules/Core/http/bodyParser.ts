import type { IncomingMessage } from 'node:http';

export const readJsonBody = async <T = Record<string, unknown>>(req: IncomingMessage, maxBytes = 1048576): Promise<T> => {
	return new Promise((resolve, reject) => {
		let totalBytes = 0;
		const chunks: Buffer[] = [];

		req.on('data', (chunk: Buffer) => {
			totalBytes += chunk.length;
			if (totalBytes > maxBytes) {
				reject(new Error('PAYLOAD_TOO_LARGE: Request body exceeds maximum allowed size.'));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});

		req.on('end', () => {
			if (chunks.length === 0) {
				resolve({} as T);
				return;
			}
			try {
				const bodyStr = Buffer.concat(chunks).toString('utf8');
				resolve(JSON.parse(bodyStr) as T);
			} catch {
				reject(new Error('INVALID_JSON: Failed to parse request body as JSON.'));
			}
		});

		req.on('error', (err) => reject(err));
	});
};
