<?php

namespace Modules\Core\Support;

class DisplaySpecHelper
{
	public static function deriveAspectRatio(int $width, int $height): string
	{
		if ($height <= 0 || $width <= 0) {
			return 'custom';
		}

		$ratio = $width / $height;

		// Standard DOOH aspect ratio tolerances (±5%)
		if (abs($ratio - (16 / 9)) < 0.05) {
			return '16:9';
		}
		if (abs($ratio - (9 / 16)) < 0.05) {
			return '9:16';
		}
		if (abs($ratio - (4 / 3)) < 0.05) {
			return '4:3';
		}
		if (abs($ratio - (3 / 4)) < 0.05) {
			return '3:4';
		}
		if (abs($ratio - 1.0) < 0.05) {
			return '1:1';
		}

		// Exact GCD reduction fallback
		$divisor = self::gcd($width, $height);
		$ratioW = (int) ($width / $divisor);
		$ratioH = (int) ($height / $divisor);

		if ($ratioW <= 32 && $ratioH <= 32) {
			return "{$ratioW}:{$ratioH}";
		}

		return 'custom';
	}

	public static function deriveOrientation(int $width, int $height): string
	{
		return $width >= $height ? 'landscape' : 'portrait';
	}

	public static function deriveSpecs(int $width, int $height): array
	{
		return [
			'orientation' => self::deriveOrientation($width, $height),
			'aspect_ratio' => self::deriveAspectRatio($width, $height),
		];
	}

	public static function gcd(int $a, int $b): int
	{
		return $b === 0 ? $a : self::gcd($b, $a % $b);
	}
}
