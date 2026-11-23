<?php

namespace Modules\Vendor\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Vendor\Models\Vendor;
use Modules\Vendor\Repositories\Interfaces\VendorRepositoryInterface;

class VendorRepository extends BaseRepository implements VendorRepositoryInterface
{
	protected array $with = ['user'];

	public function __construct(Vendor $model)
	{
		parent::__construct($model);
	}

	public function findByCode(string $code): ?Vendor
	{
		return $this->newQuery()->where('code', $code)->first();
	}

	public function findByApiKeyHash(string $hash): ?Vendor
	{
		return $this->newQuery()->where('api_key_hash', $hash)->first();
	}
}
