<?php

namespace Modules\Venue\Services;

use Illuminate\Support\Str;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class VenueService
{
    protected VenueRepositoryInterface $venueRepo;

    public function __construct(VenueRepositoryInterface $venueRepo)
    {
        $this->venueRepo = $venueRepo;
    }

    public function listVenues(int $perPage = 15)
    {
        return $this->venueRepo->paginate($perPage);
    }

    public function getVenue(int|string $id)
    {
        return $this->venueRepo->find($id);
    }

    public function createVenue(array $data)
    {
        if (empty($data['secret_key'])) {
            $data['secret_key'] = 'sec_' . Str::random(32);
        }
        return $this->venueRepo->create($data);
    }

    public function updateVenue(int|string $id, array $data)
    {
        return $this->venueRepo->update($id, $data);
    }

    public function deleteVenue(int|string $id)
    {
        return $this->venueRepo->delete($id);
    }
}
