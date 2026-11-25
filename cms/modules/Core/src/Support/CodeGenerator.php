<?php

namespace Modules\Core\Support;

use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;

class CodeGenerator
{
	public static function buildSlugBase(string $prefix, string $rawName, int $maxLength = 48): string
	{
		$cleanPrefix = trim(strtoupper(Str::slug($prefix, '-')), '-');
		$cleanName = trim(strtoupper(Str::slug($rawName, '-')), '-');
		$combined = trim("{$cleanPrefix}-{$cleanName}", '-');

		if (strlen($combined) <= $maxLength) {
			return $combined;
		}

		return rtrim(substr($combined, 0, $maxLength), '-');
	}

	public static function nextUniqueCode(string $base, array $existingCodes, bool $alwaysNumbered = false, int $padLength = 2, int $maxLength = 64): string
	{
		$existingSet = array_flip($existingCodes);

		if (!$alwaysNumbered) {
			$trimmedBase = rtrim(substr($base, 0, $maxLength), '-');
			if (!isset($existingSet[$trimmedBase])) {
				return $trimmedBase;
			}
		}

		$suffixReserve = max($padLength, 4) + 1;
		$safeBase = rtrim(substr($base, 0, max(1, $maxLength - $suffixReserve)), '-');
		$pattern = '/^' . preg_quote($safeBase, '/') . '-(\d+)$/';
		$maxCounter = 0;

		foreach ($existingCodes as $code) {
			if (preg_match($pattern, (string) $code, $matches) === 1) {
				$maxCounter = max($maxCounter, (int) $matches[1]);
			}
		}

		$next = $alwaysNumbered ? max(1, $maxCounter + 1) : max(2, $maxCounter + 1);

		while (true) {
			$suffix = $padLength > 0 ? str_pad((string) $next, $padLength, '0', STR_PAD_LEFT) : (string) $next;
			$candidate = "{$safeBase}-{$suffix}";
			if (!isset($existingSet[$candidate])) {
				return $candidate;
			}
			$next++;
		}
	}

	public static function createWithRetry(callable $callback, int $maxAttempts = 3): mixed
	{
		$attempt = 0;

		while (true) {
			$attempt++;
			try {
				return $callback();
			} catch (UniqueConstraintViolationException|QueryException $e) {
				$isDuplicate = $e instanceof UniqueConstraintViolationException || (string) $e->getCode() === '23000';
				if (!$isDuplicate || $attempt >= $maxAttempts) {
					throw $e;
				}
			}
		}
	}
}
