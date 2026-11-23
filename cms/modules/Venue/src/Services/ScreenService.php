<?php

namespace Modules\Venue\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Support\DisplaySpecHelper;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Core\Support\PlaylistCacheHelper;
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

        if (!empty($data['resolution_width']) && !empty($data['resolution_height'])) {
            $data = array_merge($data, DisplaySpecHelper::deriveSpecs((int) $data['resolution_width'], (int) $data['resolution_height']));
        }

        $screen = $this->screenRepo->create($data);
        PlaylistCacheHelper::evictVenue($screen->venue_id);

        return $screen;
    }

    public function updateScreen(int|string $id, array $data): bool
    {
        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (isset($data['resolution_width']) || isset($data['resolution_height'])) {
            $existing = $this->getScreen($id);
            $width = (int) ($data['resolution_width'] ?? $existing?->resolution_width);
            $height = (int) ($data['resolution_height'] ?? $existing?->resolution_height);
            if ($width > 0 && $height > 0) {
                $data = array_merge($data, DisplaySpecHelper::deriveSpecs($width, $height));
            }
        }

        $updated = $this->screenRepo->update($id, $data);
        if ($updated) {
            $screen = $this->getScreen($id);
            if ($screen) {
                PlaylistCacheHelper::evictVenue($screen->venue_id);
            }
        }

        return $updated;
    }

    public function deleteScreen(int|string $id): bool
    {
        $screen = $this->getScreen($id);
        $deleted = $this->screenRepo->delete($id);
        if ($deleted && $screen) {
            PlaylistCacheHelper::evictVenue($screen->venue_id);
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
        PlaylistCacheHelper::evictVenue($screen->venue_id);

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
}
