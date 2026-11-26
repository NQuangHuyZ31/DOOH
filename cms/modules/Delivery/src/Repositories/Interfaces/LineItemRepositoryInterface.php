<?php

namespace Modules\Delivery\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Delivery\Models\LineItem;

interface LineItemRepositoryInterface extends BaseRepositoryInterface
{
	public function findByCode(string $code): ?LineItem;

	public function syncVenues(int $lineItemId, array $venueIds): void;

	public function syncScreens(int $lineItemId, array $screenIds): void;

	public function syncCreatives(int $lineItemId, array $creativeData): void;

	public function getActiveLineItemsForVenue(int $venueId, ?string $date = null): array;

	public function getActiveLineItemsForScreen(int $screenId, ?string $date = null): array;

	public function getAffectedTargetsByCreativeIds(array $creativeIds): array;
}
