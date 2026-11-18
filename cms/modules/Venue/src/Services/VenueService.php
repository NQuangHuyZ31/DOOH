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

    /**
     * @param array<string, mixed> $filters
     */
    public function listVenues(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->venueRepo->paginate($perPage, $filters);
    }

    public function getVenue(int|string $id): ?Venue
    {
        /** @var Venue|null */
        return $this->venueRepo->find($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createVenue(array $data): Venue
    {
        if (empty($data['secret_key'])) {
            $data['secret_key'] = 'sec_' . Str::random(32);
        }

        /** @var Venue */
        return $this->venueRepo->create($data);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateVenue(int|string $id, array $data): bool
    {
        return $this->venueRepo->update($id, $data);
    }

    public function deleteVenue(int|string $id): bool
    {
        return $this->venueRepo->delete($id);
    }
}
