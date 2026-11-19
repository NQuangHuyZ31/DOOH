<?php

namespace Modules\Core\Tests\Unit\Support;

use Modules\Core\Support\HmacKeyUtil;
use PHPUnit\Framework\TestCase;

class HmacKeyUtilTest extends TestCase
{
	private string $masterSecret = 'test-master-secret-key-for-unit-testing-12345';

	public function test_generate_screen_key_returns_64_hex_chars(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-HN-01', $this->masterSecret);

		$this->assertSame(64, strlen($key));
		$this->assertTrue(ctype_xdigit($key));
	}

	public function test_generate_screen_key_produces_unique_keys_each_time(): void
	{
		$key1 = HmacKeyUtil::generateScreenKey('SCR-HN-01', $this->masterSecret);
		$key2 = HmacKeyUtil::generateScreenKey('SCR-HN-01', $this->masterSecret);

		$this->assertNotEquals($key1, $key2);
		$this->assertTrue(HmacKeyUtil::verifyScreenKey($key1, 'SCR-HN-01', $this->masterSecret));
		$this->assertTrue(HmacKeyUtil::verifyScreenKey($key2, 'SCR-HN-01', $this->masterSecret));
	}

	public function test_verify_screen_key_succeeds_for_valid_key(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-SGN-VCDK-01', $this->masterSecret);

		$this->assertTrue(HmacKeyUtil::verifyScreenKey($key, 'SCR-SGN-VCDK-01', $this->masterSecret));
	}

	public function test_verify_screen_key_fails_for_mismatched_identifier(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-SGN-VCDK-01', $this->masterSecret);

		$this->assertFalse(HmacKeyUtil::verifyScreenKey($key, 'SCR-SGN-VCDK-02', $this->masterSecret));
	}

	public function test_verify_screen_key_fails_for_mismatched_master_secret(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-SGN-VCDK-01', $this->masterSecret);

		$this->assertFalse(HmacKeyUtil::verifyScreenKey($key, 'SCR-SGN-VCDK-01', 'different-secret'));
	}

	public function test_verify_screen_key_fails_for_tampered_or_invalid_key(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-SGN-VCDK-01', $this->masterSecret);

		$tampered = substr_replace($key, '0', 0, 1);
		$this->assertFalse(HmacKeyUtil::verifyScreenKey($tampered, 'SCR-SGN-VCDK-01', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScreenKey('too-short', 'SCR-SGN-VCDK-01', $this->masterSecret));
		$this->assertFalse(HmacKeyUtil::verifyScreenKey(str_repeat('z', 64), 'SCR-SGN-VCDK-01', $this->masterSecret));
	}

	public function test_sign_and_verify_payload(): void
	{
		$key = HmacKeyUtil::generateScreenKey('SCR-PAYLOAD-01', $this->masterSecret);
		$payload = ['screen_id' => 10, 'beacon' => 'impression', 'timestamp' => 1700000000];

		$signature = HmacKeyUtil::signPayload($payload, $key);
		$this->assertSame(64, strlen($signature));
		$this->assertTrue(HmacKeyUtil::verifyPayload($payload, $signature, $key));

		$alteredPayload = ['screen_id' => 10, 'beacon' => 'complete', 'timestamp' => 1700000000];
		$this->assertFalse(HmacKeyUtil::verifyPayload($alteredPayload, $signature, $key));
	}

	public function test_verify_key_match(): void
	{
		$key = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

		$this->assertTrue(HmacKeyUtil::verifyKeyMatch($key, $key));
		$this->assertFalse(HmacKeyUtil::verifyKeyMatch($key, 'different_key'));
	}
}
