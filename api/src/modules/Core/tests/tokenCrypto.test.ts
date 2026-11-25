import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken, decryptToken } from '../utils/tokenCrypto.js';

describe('Core Module - Token Crypto AES-256-GCM Tests', () => {
	it('encrypts and decrypts payload successfully', () => {
		const payload = {
			venue_id: 101,
			line_item_id: 202,
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const hash = encryptToken(payload);
		assert.ok(typeof hash === 'string');
		assert.ok(hash.length > 28);

		const decrypted = decryptToken(hash);
		assert.ok(decrypted !== null);
		assert.equal(decrypted.venue_id, 101);
		assert.equal(decrypted.line_item_id, 202);
	});

	it('returns null when token is expired', () => {
		const payload = {
			venue_id: 101,
			line_item_id: 202,
			exp: Math.floor(Date.now() / 1000) - 10, // expired 10s ago
		};

		const hash = encryptToken(payload);
		const decrypted = decryptToken(hash);
		assert.equal(decrypted, null);
	});

	it('returns null when hash is tampered or corrupted', () => {
		const payload = { venue_id: 101, line_item_id: 202 };
		const hash = encryptToken(payload);

		// Tamper with one character
		const tampered = hash.slice(0, -4) + 'zzzz';
		const decrypted = decryptToken(tampered);
		assert.equal(decrypted, null);
	});
});
