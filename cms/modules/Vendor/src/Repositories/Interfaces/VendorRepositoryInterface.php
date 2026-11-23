<?php

namespace Modules\Vendor\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Vendor\Models\Vendor;

interface VendorRepositoryInterface extends BaseRepositoryInterface
{
	public function findByCode(string $code): ?Vendor;

	public function findByApiKeyHash(string $hash): ?Vendor;
}
