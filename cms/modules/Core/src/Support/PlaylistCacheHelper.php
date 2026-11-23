<?php

namespace Modules\Core\Support;

use Illuminate\Support\Facades\Redis;

class PlaylistCacheHelper
{
    public static function evictVenue(int|string $venueId): void
    {
        try {
            Redis::del("playlist:venue:{$venueId}");
        } catch (\Throwable) {
            // Non-blocking cache eviction failure
        }
    }

    public static function evictVenues(array $venueIds): void
    {
        foreach ($venueIds as $id) {
            self::evictVenue($id);
        }
    }
}
