import type { ServerResponse } from 'node:http';

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
