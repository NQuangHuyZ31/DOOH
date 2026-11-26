import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { closeRedisConnection } from '@database';
import { createApp } from '../app.js';

describe('Core Module - Health and Route Tests', () => {
	let server: http.Server;
	let baseUrl: string;

	before(async () => {
		const app = createApp();
		server = http.createServer(app);
		await new Promise<void>((resolve) => {
			server.listen(0, () => {
				const addr = server.address() as AddressInfo;
				baseUrl = `http://127.0.0.1:${addr.port}`;
				resolve();
			});
		});
	});

	after(async () => {
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
		});
		await closeRedisConnection();
	});

	it('GET /health returns 200 with operational status', async () => {
		const res = await fetch(`${baseUrl}/health`);
		assert.equal(res.status, 200);

		const data = (await res.json()) as { status: string; message: string; data: { status: string } };
		assert.equal(data.status, 'success');
		assert.equal(data.data.status, 'healthy');
	});

	it('GET / returns 200 with module registry summary', async () => {
		const res = await fetch(`${baseUrl}/`);
		assert.equal(res.status, 200);

		const data = (await res.json()) as { status: string; data: { modules: string[] } };
		assert.equal(data.status, 'success');
		assert.ok(data.data.modules.includes('Core'));
	});

	it('GET /undefined-route returns 404', async () => {
		const res = await fetch(`${baseUrl}/undefined-route`);
		assert.equal(res.status, 404);

		const data = (await res.json()) as { status: string; message: string };
		assert.equal(data.status, 'error');
	});
});
