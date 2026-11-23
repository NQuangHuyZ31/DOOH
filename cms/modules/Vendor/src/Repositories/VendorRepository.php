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

	public function linkUser(int $vendorId, int $userId): bool
	{
		$this->unlinkUser($userId);

		return (bool) $this->newQuery()->where('id', $vendorId)->update(['user_id' => $userId]);
	}

	public function unlinkUser(int $userId): bool
	{
		return (bool) $this->newQuery()->withTrashed()->where('user_id', $userId)->update(['user_id' => null]);
	}

	public function syncContactName(int $userId, string $name): bool
	{
		return (bool) $this->newQuery()->where('user_id', $userId)->update(['contact_name' => $name]);
	}
}
