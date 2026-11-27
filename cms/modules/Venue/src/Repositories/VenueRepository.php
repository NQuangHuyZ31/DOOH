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

	public function findByOwnerAndLocation(int $ownerId, string $name, string $city): ?Venue
	{
		return $this->model->newQuery()
			->where('media_owner_id', $ownerId)
			->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($name))])
			->whereRaw('LOWER(city_province) = ?', [mb_strtolower(trim($city))])
			->first();
	}
}
