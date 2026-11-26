<?php

namespace Modules\Core\Support;

use Illuminate\Support\Facades\Redis;

class PlaylistCacheHelper
{
	public static function evictKeys(array $keys): void
	{
		$uniqueKeys = array_values(array_unique(array_filter($keys, fn ($k) => is_string($k) && $k !== '')));
		if (empty($uniqueKeys)) {
			return;
		}

		try {
			Redis::del($uniqueKeys);
		} catch (\Throwable) {
			// Non-blocking cache eviction failure
		}
	}

	public static function evictVenue(int|string $venueId): void
	{
		self::evictKeys(["playlist:venue:{$venueId}"]);
	}

	public static function evictVenues(array $venueIds): void
	{
		self::evictKeys(array_map(fn ($id) => "playlist:venue:{$id}", array_filter($venueIds)));
	}

	public static function evictScreen(int|string $screenId): void
	{
		self::evictKeys(["playlist:screen:{$screenId}"]);
	}

	public static function evictScreens(array $screenIds): void
	{
		self::evictKeys(array_map(fn ($id) => "playlist:screen:{$id}", array_filter($screenIds)));
	}

	public static function evictScreenAuth(?string $screenCode): void
	{
		if (!empty($screenCode)) {
			self::evictKeys(['screen:auth:' . strtoupper(trim($screenCode))]);
		}
	}

	public static function evictScreenAuths(array $screenCodes): void
	{
		$keys = [];
		foreach ($screenCodes as $code) {
			if (!empty($code)) {
				$keys[] = 'screen:auth:' . strtoupper(trim((string) $code));
			}
		}
		self::evictKeys($keys);
	}

	public static function evictVendorAuth(?string $apiKeyHash): void
	{
		if (!empty($apiKeyHash)) {
			self::evictKeys(['vendor:auth:' . strtolower(trim($apiKeyHash))]);
		}
	}

	public static function evictTargets(array $venueIds = [], array $screenIds = [], array $screenCodes = [], array $vendorHashes = []): void
	{
		$keys = [];
		foreach (array_filter($venueIds) as $id) {
			$keys[] = "playlist:venue:{$id}";
		}
		foreach (array_filter($screenIds) as $id) {
			$keys[] = "playlist:screen:{$id}";
		}
		foreach ($screenCodes as $code) {
			if (!empty($code)) {
				$keys[] = 'screen:auth:' . strtoupper(trim((string) $code));
			}
		}
		foreach ($vendorHashes as $hash) {
			if (!empty($hash)) {
				$keys[] = 'vendor:auth:' . strtolower(trim((string) $hash));
			}
		}

		self::evictKeys($keys);
	}
}
