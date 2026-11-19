<?php

namespace Modules\Venue\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class VenueService
{
    public function __construct(
        protected VenueRepositoryInterface $venueRepo
    ) {}

    public function listVenues(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->venueRepo->paginate($perPage, $filters);
    }

    public function getVenue(int|string $id): ?Venue
    {
        /** @var Venue|null */
        return $this->venueRepo->find($id);
    }

    public function createVenue(array $data): Venue
    {
        if (empty($data['code'])) {
            $data['code'] = $this->generateUniqueCode($data['city_province'] ?? '', $data['name'] ?? 'Venue');
        } else {
            $data['code'] = strtoupper(trim($data['code']));
        }

        /** @var Venue */
        return $this->venueRepo->create($data);
    }

    public function updateVenue(int|string $id, array $data): bool
    {
        if (!empty($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        return $this->venueRepo->update($id, $data);
    }

    public function deleteVenue(int|string $id): bool
    {
        return $this->venueRepo->delete($id);
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

        $cleanName = strtoupper(Str::slug($name, '-'));
        $base = trim("{$prefix}-{$cleanName}", '-');
        $code = $base;
        $counter = 1;

        while ($this->venueRepo->findByCode($code)) {
            $counter++;
            $code = "{$base}-{$counter}";
        }

        return $code;
    }
}
