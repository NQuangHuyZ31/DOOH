<?php

namespace Modules\Venue\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Redis;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Venue\Models\Screen;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class ScreenService
{
    public function __construct(
        protected ScreenRepositoryInterface $screenRepo,
        protected VenueRepositoryInterface $venueRepo
    ) {}

    public function listScreens(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->screenRepo->paginate($perPage, $filters);
    }

    public function getScreen(int|string $id): ?Screen
    {
        /** @var Screen|null */
        return $this->screenRepo->find($id);
    }

    public function createScreen(array $data): Screen
    {
        if (empty($data['code'])) {
            $venue = $this->venueRepo->find($data['venue_id']);
            $venueCode = $venue ? $venue->code : 'VNU';
            $data['code'] = $this->generateUniqueScreenCode($venueCode);
        } else {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (empty($data['secret_key'])) {
            $data['secret_key'] = HmacKeyUtil::generateScreenKey($data['code']);
        }

        $width = (int) ($data['resolution_width'] ?? 1920);
        $height = (int) ($data['resolution_height'] ?? 1080);
        $data = array_merge($data, $this->deriveDisplaySpecs($width, $height));

        /** @var Screen */
        $screen = $this->screenRepo->create($data);
        $this->evictPlaylistCache($screen->venue_id);

        return $screen;
    }

    public function updateScreen(int|string $id, array $data): bool
    {
        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (isset($data['resolution_width']) || isset($data['resolution_height'])) {
            $width = (int) ($data['resolution_width'] ?? 1920);
            $height = (int) ($data['resolution_height'] ?? 1080);
            $data = array_merge($data, $this->deriveDisplaySpecs($width, $height));
        }

        $updated = $this->screenRepo->update($id, $data);
        if ($updated) {
            $screen = $this->getScreen($id);
            if ($screen) {
                $this->evictPlaylistCache($screen->venue_id);
            }
        }

        return $updated;
    }

    public function deleteScreen(int|string $id): bool
    {
        $screen = $this->getScreen($id);
        $deleted = $this->screenRepo->delete($id);
        if ($deleted && $screen) {
            $this->evictPlaylistCache($screen->venue_id);
        }

        return $deleted;
    }

    public function regenerateSecretKey(int|string $id): ?string
    {
        $screen = $this->getScreen($id);
        if (!$screen) {
            return null;
        }

        $newKey = HmacKeyUtil::generateScreenKey($screen->code);
        $this->screenRepo->update($id, ['secret_key' => $newKey]);
        $this->evictPlaylistCache($screen->venue_id);

        return $newKey;
    }

    public function generateUniqueScreenCode(string $venueCode): string
    {
        $prefix = "SCR-{$venueCode}";
        $counter = 1;
        $code = sprintf('%s-%02d', $prefix, $counter);

        while ($this->screenRepo->findByCode($code)) {
            $counter++;
            $code = sprintf('%s-%02d', $prefix, $counter);
        }

        return $code;
    }

    protected function deriveDisplaySpecs(int $width, int $height): array
    {
        $orientation = $width >= $height ? 'landscape' : 'portrait';

        $gcd = function (int $a, int $b) use (&$gcd): int {
            return $b === 0 ? $a : $gcd($b, $a % $b);
        };
        $divisor = $gcd($width, $height) ?: 1;
        $ratioW = $width / $divisor;
        $ratioH = $height / $divisor;
        $aspectRatio = "{$ratioW}:{$ratioH}";

        if ($width === 1920 && $height === 1080) {
            $aspectRatio = '16:9';
        } elseif ($width === 1080 && $height === 1920) {
            $aspectRatio = '9:16';
        } elseif ($width === 3840 && $height === 2160) {
            $aspectRatio = '16:9';
        }

        return [
            'orientation' => $orientation,
            'aspect_ratio' => $aspectRatio,
        ];
    }

    protected function evictPlaylistCache(int|string $venueId): void
    {
        try {
            Redis::del("playlist:venue:{$venueId}");
        } catch (\Throwable) {
            // Ignore Redis errors during offline or testing runs
        }
    }
}
