<?php

namespace Modules\Venue\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Support\CodeGenerator;
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

    public function getScreenByCode(string $code): ?Screen
    {
        $screen = $this->screenRepo->findByCode(strtoupper(trim($code)));
        $screen?->loadMissing('venue');

        return $screen;
    }

    public function createScreen(array $data): Screen
    {
        if (!empty($data['resolution_width']) && !empty($data['resolution_height'])) {
            $data = array_merge($data, DisplaySpecHelper::deriveSpecs((int) $data['resolution_width'], (int) $data['resolution_height']));
        }

        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
            if (empty($data['secret_key'])) {
                $data['secret_key'] = HmacKeyUtil::generateScopedKey('screen', $data['code'], config('venue.screen_master_secret'));
            }
            $screen = $this->screenRepo->create($data);
        } else {
            $venue = $this->venueRepo->find($data['venue_id']);
            $venueCode = $venue ? $venue->code : 'VNU';
            $hasCustomKey = !empty($data['secret_key']);

            $screen = CodeGenerator::createWithRetry(function () use ($data, $venueCode, $hasCustomKey) {
                $data['code'] = $this->generateUniqueScreenCode($venueCode);
                if (!$hasCustomKey) {
                    $data['secret_key'] = HmacKeyUtil::generateScopedKey('screen', $data['code'], config('venue.screen_master_secret'));
                }

                return $this->screenRepo->create($data);
            });
        }

        PlaylistCacheHelper::evictTargets([$screen->venue_id], [$screen->id]);

        return $screen;
    }

    public function updateScreen(int|string $id, array $data): bool
    {
        $existing = $this->getScreen($id);

        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (isset($data['resolution_width']) || isset($data['resolution_height'])) {
            $width = (int) ($data['resolution_width'] ?? $existing?->resolution_width);
            $height = (int) ($data['resolution_height'] ?? $existing?->resolution_height);
            if ($width > 0 && $height > 0) {
                $data = array_merge($data, DisplaySpecHelper::deriveSpecs($width, $height));
            }
        }

        $updated = $this->screenRepo->update($id, $data);
        if ($updated) {
            $screen = $this->getScreen($id);
            PlaylistCacheHelper::evictTargets([$existing?->venue_id, $screen?->venue_id], [$id], [$existing?->code, $screen?->code]);
        }

        return $updated;
    }

    public function deleteScreen(int|string $id): bool
    {
        $screen = $this->getScreen($id);
        $deleted = $this->screenRepo->delete($id);
        if ($deleted && $screen) {
            PlaylistCacheHelper::evictTargets([$screen->venue_id], [$screen->id], [$screen->code]);
        }

        return $deleted;
    }

    public function regenerateSecretKey(int|string $id): ?string
    {
        $screen = $this->getScreen($id);
        if (!$screen) {
            return null;
        }

        $newKey = HmacKeyUtil::generateScopedKey('screen', $screen->code, config('venue.screen_master_secret'));
        $this->screenRepo->update($id, ['secret_key' => $newKey]);
        PlaylistCacheHelper::evictTargets([$screen->venue_id], [$screen->id], [$screen->code]);

        return $newKey;
    }

    public function generateUniqueScreenCode(string $venueCode): string
    {
        $prefix = CodeGenerator::buildSlugBase('SCR', $venueCode, 56);
        $existingCodes = $this->screenRepo->getCodesByPrefix($prefix . '-');

        return CodeGenerator::nextUniqueCode($prefix, $existingCodes, true, 2, 64);
    }
}
