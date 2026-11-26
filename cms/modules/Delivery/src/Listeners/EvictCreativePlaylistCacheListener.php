<?php

namespace Modules\Delivery\Listeners;

use Modules\Core\Support\PlaylistCacheHelper;
use Modules\Creative\Events\CreativeChanged;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;

class EvictCreativePlaylistCacheListener
{
	public function __construct(protected LineItemRepositoryInterface $lineItemRepo) {}

	public function handle(CreativeChanged $event): void
	{
		$targets = $this->lineItemRepo->getAffectedTargetsByCreativeIds($event->creativeIds);
		PlaylistCacheHelper::evictTargets($targets['venue_ids'], $targets['screen_ids']);
	}
}
