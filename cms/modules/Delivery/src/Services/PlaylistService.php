<?php

namespace Modules\Delivery\Services;

use Illuminate\Support\Collection;
use Modules\Core\Support\DisplaySpecHelper;
use Modules\Creative\Models\Creative;
use Modules\Delivery\Models\LineItem;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;
use Modules\Venue\Services\ScreenService;

class PlaylistService
{
	private const DEFAULT_DURATION_SECONDS = 15;
	private const MIN_REFRESH_SECONDS = 120;
	private const MAX_REFRESH_SECONDS = 300;
	private const MAX_CREATIVE_WEIGHT = 5;

	public function __construct(
		protected LineItemRepositoryInterface $lineItemRepo,
		protected ScreenService $screenService
	) {}

	public function generatePlaylistForVenue(int $venueId): array
	{
		$items = $this->lineItemRepo->getActiveLineItemsForVenue($venueId);
		$slots = $this->buildLoopSlots($items);

		return $this->buildResponse($slots, ['venue_id' => $venueId]);
	}

	public function generatePlaylistForScreen(int $screenId): array
	{
		$screen = $this->screenService->getScreen($screenId);
		$targetOrientation = $screen?->orientation;

		$items = $this->lineItemRepo->getActiveLineItemsForScreen($screenId);
		$slots = $this->buildLoopSlots($items, $targetOrientation);

		return $this->buildResponse($slots, [
			'screen_id' => $screenId,
			'venue_id' => $screen?->venue_id,
			'orientation' => $targetOrientation,
		]);
	}

	protected function buildResponse(array $slots, array $meta): array
	{
		$totalDuration = array_sum(array_column($slots, 'duration'));

		return array_merge($meta, [
			'refresh_seconds' => max(self::MIN_REFRESH_SECONDS, min(self::MAX_REFRESH_SECONDS, $totalDuration ?: self::MIN_REFRESH_SECONDS)),
			'total_duration_seconds' => $totalDuration,
			'slots_count' => count($slots),
			'playlist' => $slots,
		]);
	}

	protected function buildLoopSlots(array $items, ?string $targetOrientation = null): array
	{
		$byCampaign = $this->groupEntriesByCampaign($items, $targetOrientation);

		return $this->interleaveSlots($byCampaign);
	}

	protected function isLineItemEligible(LineItem $item): bool
	{
		$target = (int) ($item->target_impressions ?? 0);
		if ($target > 0 && (int) ($item->total_delivered_impressions ?? 0) >= $target) {
			return false;
		}

		return true;
	}

	protected function resolveEligibleCreatives(LineItem $item, ?string $targetOrientation): Collection
	{
		$creatives = $item->creatives->isNotEmpty()
			? $item->creatives
			: ($item->creative ? collect([$item->creative]) : collect());

		$approved = $creatives->filter(function (Creative $cr) {
			$pivotStatus = $cr->pivot?->status ?? 'active';

			return $cr->status === 'approved' && $pivotStatus === 'active';
		});

		if (!$targetOrientation || $targetOrientation === 'custom') {
			return $approved->values();
		}

		return $approved->filter(function (Creative $cr) use ($targetOrientation) {
			if (empty($cr->width) || empty($cr->height)) {
				return true;
			}

			return DisplaySpecHelper::deriveOrientation((int) $cr->width, (int) $cr->height) === $targetOrientation;
		})->values();
	}

	protected function groupEntriesByCampaign(array $items, ?string $targetOrientation): array
	{
		$byCampaign = [];

		foreach ($items as $item) {
			if (!$item instanceof LineItem || !$this->isLineItemEligible($item)) {
				continue;
			}

			$creatives = $this->resolveEligibleCreatives($item, $targetOrientation);
			foreach ($creatives as $creative) {
				$weight = max(1, min(self::MAX_CREATIVE_WEIGHT, (int) ($creative->pivot?->weight ?? 1)));
				for ($i = 0; $i < $weight; $i++) {
					$byCampaign[$item->campaign_id][] = ['item' => $item, 'creative' => $creative];
				}
			}
		}

		return $byCampaign;
	}

	protected function interleaveSlots(array $byCampaign): array
	{
		$slots = [];
		$hasMore = true;

		while ($hasMore) {
			$hasMore = false;
			foreach ($byCampaign as &$campaignEntries) {
				if (empty($campaignEntries)) {
					continue;
				}

				$entry = array_shift($campaignEntries);
				$slots[] = $this->formatSlot($entry['item'], $entry['creative']);
				if (!empty($campaignEntries)) {
					$hasMore = true;
				}
			}
		}

		return $slots;
	}

	protected function formatSlot(LineItem $item, Creative $creative): array
	{
		return [
			'line_item_id' => $item->id,
			'line_item_name' => $item->name,
			'campaign_id' => $item->campaign_id,
			'creative_id' => $creative->id,
			'priority' => $item->priority,
			'type' => $creative->type ?? 'video',
			'media_url' => $creative->media_url ?? '',
			'duration' => (int) ($creative->duration_seconds ?: self::DEFAULT_DURATION_SECONDS),
			'daily_impression_cap' => (int) ($item->daily_impression_cap ?? 0),
		];
	}
}
