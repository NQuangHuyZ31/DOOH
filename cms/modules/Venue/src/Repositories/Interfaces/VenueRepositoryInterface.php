<?php

namespace Modules\Venue\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Venue\Models\Venue;

interface VenueRepositoryInterface extends BaseRepositoryInterface
{
	public function findByCode(string $code): ?Venue;

	public function findByOwnerAndLocation(int $ownerId, string $name, string $city): ?Venue;
}
