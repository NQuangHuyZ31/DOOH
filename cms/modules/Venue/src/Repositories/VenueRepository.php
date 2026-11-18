<?php

namespace Modules\Venue\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class VenueRepository extends BaseRepository implements VenueRepositoryInterface
{
    public function __construct(Venue $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code)
    {
        return $this->model->where('code', $code)->first();
    }
}
