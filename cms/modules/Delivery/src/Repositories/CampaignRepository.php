<?php

namespace Modules\Delivery\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Delivery\Models\Campaign;
use Modules\Delivery\Repositories\Interfaces\CampaignRepositoryInterface;

class CampaignRepository extends BaseRepository implements CampaignRepositoryInterface
{
	protected array $with = ['user', 'lineItems'];
	protected array $withCount = ['lineItems'];

	public function __construct(Campaign $model)
	{
		parent::__construct($model);
	}

	public function findByCode(string $code): ?Campaign
	{
		return $this->newQuery()->where('code', $code)->first();
	}
}
