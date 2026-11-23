<?php

namespace Modules\Delivery\Services;

use Modules\Delivery\Models\LineItem;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;
use Modules\Venue\Models\Screen;

class PlaylistService
{
	public function __construct(
		protected LineItemRepositoryInterface $lineItemRepo
	) {}

	public function generatePlaylistForVenue(int $venueId): array
	{
		$items = $this->lineItemRepo->getActiveLineItemsForVenue($venueId);
		$slots = $this->buildLoopSlots($items, ['venue_id' => $venueId]);

		$totalDuration = array_sum(array_column($slots, 'duration'));

		return [
			'venue_id' => $venueId,
			'refresh_seconds' => max(120, min(300, $totalDuration ?: 120)),
			'total_duration_seconds' => $totalDuration,
			'slots_count' => count($slots),
			'playlist' => $slots,
		];
	}

	public function generatePlaylistForScreen(int $screenId): array
	{
		/** @var Screen|null $screen */
		$screen = Screen::find($screenId);
		$targetOrientation = $screen?->orientation ?? 'landscape';

		$items = $this->lineItemRepo->getActiveLineItemsForScreen($screenId);
		$slots = $this->buildLoopSlots($items, [
			'screen_id' => $screenId,
			'venue_id' => $screen?->venue_id,
			'orientation' => $targetOrientation,
		]);

		$totalDuration = array_sum(array_column($slots, 'duration'));

		return [
			'screen_id' => $screenId,
			'venue_id' => $screen?->venue_id,
			'orientation' => $targetOrientation,
			'refresh_seconds' => max(120, min(300, $totalDuration ?: 120)),
			'total_duration_seconds' => $totalDuration,
			'slots_count' => count($slots),
			'playlist' => $slots,
		];
	}

	protected function buildLoopSlots(array $items, array $context): array
	{
		$slots = [];
		$byCampaign = [];
		$targetOrientation = $context['orientation'] ?? null;

		foreach ($items as $item) {
			/** @var LineItem $item */
			$creatives = $item->creatives->isNotEmpty() ? $item->creatives : ($item->creative ? collect([$item->creative]) : collect());

			// Filter creatives matching screen orientation if targetOrientation is set
			if ($targetOrientation && $creatives->isNotEmpty()) {
				$matched = $creatives->filter(function ($cr) use ($targetOrientation) {
					$w = (int) ($cr->width ?? 1920);
					$h = (int) ($cr->height ?? 1080);
					$crOrientation = $w >= $h ? 'landscape' : 'portrait';
					return $crOrientation === $targetOrientation || $targetOrientation === 'custom';
				});
				if ($matched->isNotEmpty()) {
					$creatives = $matched;
				}
			}

			if ($creatives->isEmpty()) {
				$byCampaign[$item->campaign_id][] = ['item' => $item, 'creative' => null];
			} else {
				foreach ($creatives as $cr) {
					$weight = (int) ($cr->pivot?->weight ?? 1);
					for ($w = 0; $w < max(1, min(5, $weight)); $w++) {
						$byCampaign[$item->campaign_id][] = ['item' => $item, 'creative' => $cr];
					}
				}
			}
		}

		$hasMore = true;
		while ($hasMore) {
			$hasMore = false;
			foreach ($byCampaign as $cId => &$campaignItems) {
				if (!empty($campaignItems)) {
					$entry = array_shift($campaignItems);
					$item = $entry['item'];
					$creative = $entry['creative'];
					$duration = $creative?->duration_seconds ?: 15;

					$opaqueToken = base64_encode(json_encode([
						's' => $context['screen_id'] ?? null,
						'v' => $context['venue_id'] ?? null,
						'l' => $item->id,
						'c' => $item->campaign_id,
						'cr' => $creative?->id,
						'ts' => now()->timestamp,
					]));

					$slots[] = [
						'line_item_id' => $item->id,
						'line_item_name' => $item->name,
						'campaign_id' => $item->campaign_id,
						'creative_id' => $creative?->id,
						'priority' => $item->priority,
						'type' => $creative?->type ?? 'video',
						'media_url' => $creative?->media_url ?? '',
						'duration' => $duration,
						'tracking' => [
							'impression_url' => "/api/v1/log/imp/{$opaqueToken}",
							'complete_url' => "/api/v1/log/complete/{$opaqueToken}",
						],
					];
					if (!empty($campaignItems)) {
						$hasMore = true;
					}
				}
			}
		}

		return $slots;
	}
}
