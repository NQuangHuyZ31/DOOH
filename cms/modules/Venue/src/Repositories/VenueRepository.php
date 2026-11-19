<?php

namespace Modules\Venue\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class VenueRepository extends BaseRepository implements VenueRepositoryInterface
{
    protected array $with = ['screens', 'mediaOwner'];

    public function __construct(Venue $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?Venue
    {
        return $this->newQuery()->where('code', $code)->first();
    }
}
