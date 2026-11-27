<?php

namespace Modules\Venue\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\BaseRepository;
use Modules\Venue\Models\Screen;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;

class ScreenRepository extends BaseRepository implements ScreenRepositoryInterface
{
	protected array $with = ['venue'];

	public function __construct(Screen $model)
	{
		parent::__construct($model);
	}

	public function findByCode(string $code): ?Screen
	{
		return $this->newQuery()->where('code', $code)->first();
	}

	public function findByOwnerAndHardwareUid(int $ownerId, string $hardwareUid): ?Screen
	{
		return $this->model->newQuery()
			->where('hardware_device_uid', trim($hardwareUid))
			->whereHas('venue', fn ($q) => $q->where('media_owner_id', $ownerId))
			->first();
	}

	public function getByMediaOwner(int $ownerId): Collection
	{
		return $this->model->newQuery()
			->with('venue')
			->whereHas('venue', fn ($q) => $q->where('media_owner_id', $ownerId))
			->orderByDesc('id')
			->get();
	}
}
