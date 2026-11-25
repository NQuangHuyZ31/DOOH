import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiResponse<T = unknown> {
	status: 'success' | 'error';
	message: string;
	data?: T;
	errors?: Record<string, string[]>;
}

export const sendJson = (res: ServerResponse, statusCode: number, payload: unknown): void => {
	const body = JSON.stringify(payload);
	res.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(body),
	});
	res.end(body);
};

export const sendNoContent = (res: ServerResponse): void => {
	res.writeHead(204, { 'Content-Length': '0' });
	res.end();
};

export const sendSuccess = <T>(res: ServerResponse, data: T, message = 'Success', statusCode = 200): void => {
	sendJson(res, statusCode, { status: 'success', message, data });
};

export const sendError = (res: ServerResponse, statusCode: number, message: string, errors?: Record<string, string[]>): void => {
	sendJson(res, statusCode, { status: 'error', message, errors });
};

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
