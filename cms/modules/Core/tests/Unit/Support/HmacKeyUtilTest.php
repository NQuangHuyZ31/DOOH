<?php

namespace Modules\Core\Tests\Unit\Support;

use Modules\Core\Support\HmacKeyUtil;
use PHPUnit\Framework\TestCase;

class HmacKeyUtilTest extends TestCase
{
	private string $masterSecret = 'test-master-secret-key-for-unit-testing-12345';

	public function test_generate_scoped_key_returns_64_hex_chars_by_default(): void
	{
		$key = HmacKeyUtil::generateScopedKey('screen', 'SCR-HN-01', $this->masterSecret);

		$this->assertSame(64, strlen($key));
		$this->assertTrue(ctype_xdigit($key));
	}

	public function test_generate_scoped_key_produces_unique_keys_each_time(): void
	{
		$key1 = HmacKeyUtil::generateScopedKey('screen', 'SCR-HN-01', $this->masterSecret);
		$key2 = HmacKeyUtil::generateScopedKey('screen', 'SCR-HN-01', $this->masterSecret);

		$this->assertNotEquals($key1, $key2);
		$this->assertTrue(HmacKeyUtil::verifyScopedKey($key1, 'screen', 'SCR-HN-01', $this->masterSecret));
		$this->assertTrue(HmacKeyUtil::verifyScopedKey($key2, 'screen', 'SCR-HN-01', $this->masterSecret));
	}

	public function test_verify_scoped_key_supports_arbitrary_scopes_and_lengths(): void
	{
		$key = HmacKeyUtil::generateScopedKey('webhook', 'WH-01', $this->masterSecret, 12, 24);

		$this->assertSame(48, strlen($key));
		$this->assertTrue(HmacKeyUtil::verifyScopedKey($key, 'webhook', 'WH-01', $this->masterSecret, 12, 24));
		$this->assertFalse(HmacKeyUtil::verifyScopedKey($key, 'screen', 'WH-01', $this->masterSecret, 12, 24));
	}

	public function test_verify_scoped_key_fails_for_mismatched_scope_identifier_or_secret(): void
	{
		$key = HmacKeyUtil::generateScopedKey('screen', 'SCR-SGN-VCDK-01', $this->masterSecret);

		$this->assertFalse(HmacKeyUtil::verifyScopedKey($key, 'device', 'SCR-SGN-VCDK-01', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScopedKey($key, 'screen', 'SCR-SGN-VCDK-02', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScopedKey($key, 'screen', 'SCR-SGN-VCDK-01', 'different-secret'));
	}

	public function test_verify_scoped_key_fails_for_tampered_or_invalid_key(): void
	{
		$key = HmacKeyUtil::generateScopedKey('screen', 'SCR-SGN-VCDK-01', $this->masterSecret);

		$tampered = substr_replace($key, $key[0] === '0' ? '1' : '0', 0, 1);
		$this->assertFalse(HmacKeyUtil::verifyScopedKey($tampered, 'screen', 'SCR-SGN-VCDK-01', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScopedKey('too-short', 'screen', 'SCR-SGN-VCDK-01', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScopedKey(str_repeat('z', 64), 'screen', 'SCR-SGN-VCDK-01', $this->masterSecret));
	}

	public function test_sign_and_verify_payload(): void
	{
		$key = HmacKeyUtil::generateScopedKey('screen', 'SCR-PAYLOAD-01', $this->masterSecret);
		$payload = ['screen_id' => 10, 'beacon' => 'impression', 'timestamp' => 1700000000];

		$signature = HmacKeyUtil::signPayload($payload, $key);
		$this->assertSame(64, strlen($signature));
		$this->assertTrue(HmacKeyUtil::verifyPayload($payload, $signature, $key));

		$alteredPayload = ['screen_id' => 10, 'beacon' => 'complete', 'timestamp' => 1700000000];
		$this->assertFalse(HmacKeyUtil::verifyPayload($alteredPayload, $signature, $key));

		$sha512Sig = HmacKeyUtil::signPayload($payload, $key, 'sha512');
		$this->assertSame(128, strlen($sha512Sig));
		$this->assertTrue(HmacKeyUtil::verifyPayload($payload, $sha512Sig, $key, 'sha512'));
	}

	public function test_verify_key_match(): void
	{
		$key = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

		$this->assertTrue(HmacKeyUtil::verifyKeyMatch($key, $key));
		$this->assertFalse(HmacKeyUtil::verifyKeyMatch($key, 'different_key'));
	}

	public function test_generate_prefixed_key(): void
	{
		$keyData = HmacKeyUtil::generatePrefixedKey('dooh_test_');

		$this->assertNotEmpty($keyData['plain_key']);
		$this->assertStringStartsWith('dooh_test_', $keyData['plain_key']);
		$this->assertSame(strlen('dooh_test_') + 48, strlen($keyData['plain_key']));
		$this->assertSame(hash('sha256', $keyData['plain_key']), $keyData['hash']);
		$this->assertSame(substr($keyData['plain_key'], 0, 16), $keyData['prefix']);

		$customKey = HmacKeyUtil::generatePrefixedKey('whsec_', 16, 12, 'sha512');
		$this->assertSame(strlen('whsec_') + 32, strlen($customKey['plain_key']));
		$this->assertSame(hash('sha512', $customKey['plain_key']), $customKey['hash']);
		$this->assertSame(substr($customKey['plain_key'], 0, 12), $customKey['prefix']);
	}

	public function test_hash(): void
	{
		$plainKey = 'dooh_live_sample_key_123';

		$this->assertSame(hash('sha256', $plainKey), HmacKeyUtil::hash($plainKey));
		$this->assertSame(hash('sha512', $plainKey), HmacKeyUtil::hash($plainKey, 'sha512'));
	}
}
