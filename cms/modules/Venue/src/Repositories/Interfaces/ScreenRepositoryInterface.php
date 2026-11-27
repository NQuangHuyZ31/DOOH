<?php

namespace Modules\Venue\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Venue\Models\Screen;

interface ScreenRepositoryInterface extends BaseRepositoryInterface
{
	public function findByCode(string $code): ?Screen;

	public function findByOwnerAndHardwareUid(int $ownerId, string $hardwareUid): ?Screen;

	public function getByMediaOwner(int $ownerId): Collection;
}
