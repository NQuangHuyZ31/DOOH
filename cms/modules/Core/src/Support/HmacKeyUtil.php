<?php

namespace Modules\Core\Support;

class HmacKeyUtil
{
	public static function getMasterSecret(?string $customSecret = null): string
	{
		if (!empty($customSecret)) {
			return $customSecret;
		}

		$configuredSecret = config('venue.screen_master_secret');
		if (!empty($configuredSecret)) {
			return $configuredSecret;
		}

		$appKey = (string) config('app.key', '');
		if (str_starts_with($appKey, 'base64:')) {
			$decoded = base64_decode(substr($appKey, 7), true);
			if ($decoded !== false && strlen($decoded) > 0) {
				return $decoded;
			}
		}

		return !empty($appKey) ? $appKey : 'dooh-fallback-secret-key-32chars!';
	}

	public static function generateScreenKey(string $identifier, ?string $masterSecret = null): string
	{
		$secret = self::getMasterSecret($masterSecret);
		$nonce = bin2hex(random_bytes(16));
		$signature = substr(hash_hmac('sha256', "screen:{$identifier}:{$nonce}", $secret), 0, 32);

		return $nonce . $signature;
	}

	public static function verifyScreenKey(string $key, string $identifier, ?string $masterSecret = null): bool
	{
		if (strlen($key) !== 64 || !ctype_xdigit($key)) {
			return false;
		}

		$secret = self::getMasterSecret($masterSecret);
		$nonce = substr($key, 0, 32);
		$signature = substr($key, 32, 32);
		$expectedSignature = substr(hash_hmac('sha256', "screen:{$identifier}:{$nonce}", $secret), 0, 32);

		return hash_equals($expectedSignature, $signature);
	}

	public static function signPayload(string|array $data, string $secretKey): string
	{
		$payload = is_array($data)
			? (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
			: (string) $data;

		return hash_hmac('sha256', $payload, $secretKey);
	}

	public static function verifyPayload(string|array $data, string $signature, string $secretKey): bool
	{
		$expected = self::signPayload($data, $secretKey);

		return hash_equals($expected, $signature);
	}

	public static function verifyKeyMatch(string $providedKey, string $storedKey): bool
	{
		return hash_equals($storedKey, $providedKey);
	}
}
