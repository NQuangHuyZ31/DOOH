<?php

namespace Modules\Delivery\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Delivery\Models\LineItem;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;

class LineItemRepository extends BaseRepository implements LineItemRepositoryInterface
{
	protected array $with = ['campaign', 'creative', 'creatives', 'venues', 'screens'];

	public function __construct(LineItem $model)
	{
		parent::__construct($model);
	}

	public function findByCode(string $code): ?LineItem
	{
		return $this->newQuery()->where('code', $code)->first();
	}

	public function syncVenues(int $lineItemId, array $venueIds): void
	{
		/** @var LineItem|null $item */
		$item = $this->find($lineItemId);
		$item?->venues()->sync($venueIds);
	}

	public function syncScreens(int $lineItemId, array $screenIds): void
	{
		/** @var LineItem|null $item */
		$item = $this->find($lineItemId);
		$item?->screens()->sync($screenIds);
	}

	public function syncCreatives(int $lineItemId, array $creativeData): void
	{
		/** @var LineItem|null $item */
		$item = $this->find($lineItemId);
		if (!$item) return;

		$sync = [];
		foreach ($creativeData as $key => $val) {
			if (is_array($val) && isset($val['id'])) {
				$sync[$val['id']] = ['weight' => $val['weight'] ?? 1, 'status' => $val['status'] ?? 'active'];
			} elseif (is_numeric($val)) {
				$sync[(int) $val] = ['weight' => 1, 'status' => 'active'];
			} elseif (is_numeric($key) && is_array($val)) {
				$sync[$key] = ['weight' => $val['weight'] ?? 1, 'status' => $val['status'] ?? 'active'];
			}
		}
		$item->creatives()->sync($sync);
	}

	public function getActiveLineItemsForVenue(int $venueId, ?string $date = null): array
	{
		$targetDate = $date ?? now()->toDateString();

		return $this->newQuery()
			->where('status', 'active')
			->where('start_date', '<=', $targetDate)
			->where('end_date', '>=', $targetDate)
			->whereHas('venues', fn ($q) => $q->where('venues.id', $venueId))
			->whereHas('campaign', fn ($q) => $q->where('status', 'active'))
			->with(['creative', 'creatives'])
			->orderByDesc('priority')
			->get()
			->all();
	}

	public function getActiveLineItemsForScreen(int $screenId, ?string $date = null): array
	{
		$targetDate = $date ?? now()->toDateString();

		return $this->newQuery()
			->where('status', 'active')
			->where('start_date', '<=', $targetDate)
			->where('end_date', '>=', $targetDate)
			->whereHas('screens', fn ($q) => $q->where('screens.id', $screenId))
			->whereHas('campaign', fn ($q) => $q->where('status', 'active'))
			->with(['creative', 'creatives', 'screens'])
			->orderByDesc('priority')
			->get()
			->all();
	}
}
