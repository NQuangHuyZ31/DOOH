<?php

namespace Modules\Delivery\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Delivery\Models\Campaign;

interface CampaignRepositoryInterface extends BaseRepositoryInterface
{
	public function findByCode(string $code): ?Campaign;
}
