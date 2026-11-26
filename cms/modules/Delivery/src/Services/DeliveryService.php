<?php

namespace Modules\Delivery\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Core\Support\PlaylistCacheHelper;
use Modules\Delivery\Models\Campaign;
use Modules\Delivery\Models\LineItem;
use Modules\Delivery\Repositories\Interfaces\CampaignRepositoryInterface;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;

class DeliveryService
{
	public function __construct(
		protected CampaignRepositoryInterface $campaignRepo,
		protected LineItemRepositoryInterface $lineItemRepo
	) {}

	public function listCampaigns(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->campaignRepo->paginate($perPage, $filters);
	}

	public function getCampaign(int|string $id): ?Campaign
	{
		return $this->campaignRepo->find($id);
	}

	public function createCampaign(array $data): Campaign
	{
		if (empty($data['code'])) {
			$data['code'] = $this->generateUniqueCode('CMP', $data['name'] ?? 'Campaign');
		} else {
			$data['code'] = strtoupper(trim($data['code']));
		}

		return $this->campaignRepo->create($data);
	}

	public function updateCampaign(int|string $id, array $data): ?Campaign
	{
		if (!empty($code = $data['code'] ?? null)) {
			$data['code'] = strtoupper(trim($code));
		}

		$updated = $this->campaignRepo->update($id, $data);
		if ($updated) {
			[$venueIds, $screenIds] = $this->extractCampaignTargets($this->campaignRepo->find($id));
			PlaylistCacheHelper::evictTargets($venueIds, $screenIds);
		}

		return $updated ? $this->getCampaign($id) : null;
	}

	public function deleteCampaign(int|string $id): bool
	{
		[$venueIds, $screenIds] = $this->extractCampaignTargets($this->campaignRepo->find($id));

		$deleted = $this->campaignRepo->delete($id);
		if ($deleted) {
			PlaylistCacheHelper::evictTargets($venueIds, $screenIds);
		}

		return $deleted;
	}

	public function listLineItems(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->lineItemRepo->paginate($perPage, $filters);
	}

	public function getLineItem(int|string $id): ?LineItem
	{
		return $this->lineItemRepo->find($id);
	}

	public function createLineItem(array $data): LineItem
	{
		return DB::transaction(function () use ($data) {
			if (empty($data['code'])) {
				$data['code'] = $this->generateUniqueCode('LI', $data['name'] ?? 'LineItem');
			} else {
				$data['code'] = strtoupper(trim($data['code']));
			}

			$venueIds = $data['venue_ids'] ?? [];
			$screenIds = $data['screen_ids'] ?? [];
			$creativeIds = $data['creative_ids'] ?? ($data['creatives'] ?? null);
			unset($data['venue_ids'], $data['screen_ids'], $data['creative_ids'], $data['creatives']);

			$lineItem = $this->lineItemRepo->create($data);

			if (!empty($venueIds)) {
				$this->lineItemRepo->syncVenues($lineItem->id, $venueIds);
			}
			if (!empty($screenIds)) {
				$this->lineItemRepo->syncScreens($lineItem->id, $screenIds);
			}
			if (!empty($creativeIds)) {
				$this->lineItemRepo->syncCreatives($lineItem->id, $creativeIds);
			}

			DB::afterCommit(fn () => PlaylistCacheHelper::evictTargets($venueIds, $screenIds));

			return $this->lineItemRepo->find($lineItem->id);
		});
	}

	public function updateLineItem(int|string $id, array $data): ?LineItem
	{
		return DB::transaction(function () use ($id, $data) {
			if (!empty($code = $data['code'] ?? null)) {
				$data['code'] = strtoupper(trim($code));
			}

			$hasVenues = array_key_exists('venue_ids', $data);
			$venueIds = $data['venue_ids'] ?? [];
			$hasScreens = array_key_exists('screen_ids', $data);
			$screenIds = $data['screen_ids'] ?? [];
			$hasCreatives = array_key_exists('creative_ids', $data) || array_key_exists('creatives', $data);
			$creativeIds = $data['creative_ids'] ?? ($data['creatives'] ?? []);
			unset($data['venue_ids'], $data['screen_ids'], $data['creative_ids'], $data['creatives']);

			$existing = $this->lineItemRepo->find($id);
			$previousVenues = $existing ? $existing->venues->pluck('id')->all() : [];
			$previousScreens = $existing ? $existing->screens->pluck('id')->all() : [];

			$this->lineItemRepo->update($id, $data);

			$affectedVenues = $previousVenues;
			if ($hasVenues) {
				$this->lineItemRepo->syncVenues((int) $id, $venueIds);
				$affectedVenues = array_unique(array_merge($previousVenues, $venueIds));
			}

			$affectedScreens = $previousScreens;
			if ($hasScreens) {
				$this->lineItemRepo->syncScreens((int) $id, $screenIds);
				$affectedScreens = array_unique(array_merge($previousScreens, $screenIds));
			}

			if ($hasCreatives) {
				$this->lineItemRepo->syncCreatives((int) $id, $creativeIds);
			}

			DB::afterCommit(fn () => PlaylistCacheHelper::evictTargets($affectedVenues, $affectedScreens));

			return $this->getLineItem($id);
		});
	}

	public function createBatchLineItems(array $items): array
	{
		$created = [];
		foreach ($items as $itemData) {
			$created[] = $this->createLineItem($itemData);
		}

		return $created;
	}

	public function deleteLineItem(int|string $id): bool
	{
		$item = $this->lineItemRepo->find($id);
		$venueIds = $item ? $item->venues->pluck('id')->all() : [];
		$screenIds = $item ? $item->screens->pluck('id')->all() : [];

		$deleted = $this->lineItemRepo->delete($id);
		if ($deleted) {
			PlaylistCacheHelper::evictTargets($venueIds, $screenIds);
		}

		return $deleted;
	}

	protected function extractCampaignTargets(?Campaign $campaign): array
	{
		if (!$campaign) {
			return [[], []];
		}

		$venueIds = $campaign->lineItems->flatMap(fn ($li) => $li->venues->pluck('id'))->unique()->all();
		$screenIds = $campaign->lineItems->flatMap(fn ($li) => $li->screens->pluck('id'))->unique()->all();

		return [$venueIds, $screenIds];
	}

	protected function generateUniqueCode(string $prefix, string $name): string
	{
		$slug = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 8));
		if (empty($slug)) {
			$slug = 'ITEM';
		}

		return "{$prefix}-{$slug}-" . strtoupper(Str::random(4));
	}
}
