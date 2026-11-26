<?php

namespace Modules\Venue\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Modules\Core\Support\CodeGenerator;
use Modules\Core\Support\PlaylistCacheHelper;
use Modules\User\Services\UserService;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class VenueService
{
    public function __construct(
        protected VenueRepositoryInterface $venueRepo,
        protected UserService $userService
    ) {}

    public function listVenues(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->venueRepo->paginate($perPage, $filters);
    }

    public function getVenue(int|string $id): ?Venue
    {
        return $this->venueRepo->find($id);
    }

    public function createVenue(array $data): Venue
    {
        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));

            return $this->venueRepo->create($data);
        }

        return CodeGenerator::createWithRetry(function () use ($data) {
            $data['code'] = $this->generateUniqueCode($data['city_province'] ?? '', $data['name'] ?? 'Venue');

            return $this->venueRepo->create($data);
        });
    }

    public function updateVenue(int|string $id, array $data): bool
    {
        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        $venue = $this->getVenue($id);
        $updated = $this->venueRepo->update($id, $data);
        if ($updated) {
            $this->evictVenueAndChildScreens($id, $venue);
        }

        return $updated;
    }

    public function deleteVenue(int|string $id): bool
    {
        $venue = $this->getVenue($id);
        $deleted = $this->venueRepo->delete($id);
        if ($deleted) {
            $this->evictVenueAndChildScreens($id, $venue);
        }

        return $deleted;
    }

    protected function evictVenueAndChildScreens(int|string $venueId, ?Venue $venue): void
    {
        if (!$venue) {
            PlaylistCacheHelper::evictVenue($venueId);

            return;
        }

        $screens = $venue->screens()->get(['id', 'code']);
        PlaylistCacheHelper::evictTargets([$venueId], $screens->pluck('id')->all(), $screens->pluck('code')->all());
    }

    public function generateUniqueCode(?string $city, string $name): string
    {
        $prefix = 'VNU';
        if ($city) {
            $c = strtoupper(Str::slug($city, ''));
            if (str_contains($c, 'HOCHIMINH') || str_contains($c, 'SAIGON') || str_contains($c, 'HCM')) {
                $prefix = 'SGN';
            } elseif (str_contains($c, 'HANOI')) {
                $prefix = 'HAN';
            } elseif (str_contains($c, 'DANANG')) {
                $prefix = 'DNG';
            } else {
                $prefix = substr($c, 0, 3) ?: 'VNU';
            }
        }

        // Keep venue code <= 52 chars so child screen codes (SCR-{venueCode}-01) stay within varchar(64)
        $base = CodeGenerator::buildSlugBase($prefix, $name, 48);
        $existingCodes = $this->venueRepo->getCodesByPrefix($base);

        return CodeGenerator::nextUniqueCode($base, $existingCodes, false, 0, 52);
    }

    public function getMediaOwnersList(): array
    {
        return $this->userService->getMediaOwners();
    }
}
