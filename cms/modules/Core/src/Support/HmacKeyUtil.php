<?php

namespace Modules\Core\Support;

class HmacKeyUtil
{
	public static function getMasterSecret(?string $customSecret = null): string
	{
		if (!empty($customSecret)) {
			return $customSecret;
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

	public static function generateScopedKey(string $scope, string $identifier, ?string $masterSecret = null, int $nonceBytes = 16, int $signatureLength = 32): string
	{
		$secret = self::getMasterSecret($masterSecret);
		$nonce = bin2hex(random_bytes($nonceBytes));
		$signature = substr(hash_hmac('sha256', "{$scope}:{$identifier}:{$nonce}", $secret), 0, $signatureLength);

		return $nonce . $signature;
	}

	public static function verifyScopedKey(string $key, string $scope, string $identifier, ?string $masterSecret = null, int $nonceBytes = 16, int $signatureLength = 32): bool
	{
		$nonceLength = $nonceBytes * 2;
		if (strlen($key) !== $nonceLength + $signatureLength || !ctype_xdigit($key)) {
			return false;
		}

		$secret = self::getMasterSecret($masterSecret);
		$nonce = substr($key, 0, $nonceLength);
		$signature = substr($key, $nonceLength, $signatureLength);
		$expectedSignature = substr(hash_hmac('sha256', "{$scope}:{$identifier}:{$nonce}", $secret), 0, $signatureLength);

		return hash_equals($expectedSignature, $signature);
	}

	public static function signPayload(string|array $data, string $secretKey, string $algo = 'sha256'): string
	{
		$payload = is_array($data)
			? (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
			: (string) $data;

		return hash_hmac($algo, $payload, $secretKey);
	}

	public static function verifyPayload(string|array $data, string $signature, string $secretKey, string $algo = 'sha256'): bool
	{
		return hash_equals(self::signPayload($data, $secretKey, $algo), $signature);
	}

	public static function verifyKeyMatch(string $providedKey, string $storedKey): bool
	{
		return hash_equals($storedKey, $providedKey);
	}

	public static function generatePrefixedKey(string $prefix = '', int $randomBytes = 24, int $displayPrefixLength = 16, string $hashAlgo = 'sha256'): array
	{
		$plainKey = $prefix . bin2hex(random_bytes($randomBytes));

		return [
			'plain_key' => $plainKey,
			'hash' => self::hash($plainKey, $hashAlgo),
			'prefix' => substr($plainKey, 0, $displayPrefixLength),
		];
	}

	public static function hash(string $value, string $algo = 'sha256'): string
	{
		return hash($algo, $value);
	}
}
