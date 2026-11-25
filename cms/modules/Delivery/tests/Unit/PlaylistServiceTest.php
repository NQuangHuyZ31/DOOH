<?php

namespace Modules\Delivery\Tests\Unit;

use Mockery;
use Modules\Creative\Models\Creative;
use Modules\Delivery\Models\LineItem;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;
use Modules\Delivery\Services\PlaylistService;
use Modules\Venue\Models\Screen;
use Modules\Venue\Services\ScreenService;
use PHPUnit\Framework\TestCase;

class PlaylistServiceTest extends TestCase
{
	protected function tearDown(): void
	{
		Mockery::close();
		parent::tearDown();
	}

	public function test_generate_playlist_for_screen_uses_screen_service_and_matches_orientation(): void
	{
		$screen = new Screen(['venue_id' => 5, 'orientation' => 'square']);
		$screen->id = 10;

		$squareCr = $this->makeCreative(1, 'approved', 1080, 1080, 15, 'active', 1);
		$landscapeCr = $this->makeCreative(2, 'approved', 1920, 1080, 15, 'active', 1);
		$pendingSquareCr = $this->makeCreative(3, 'pending_review', 1080, 1080, 15, 'active', 1);

		$lineItem = $this->makeLineItem(100, 1, 'Square Promo', 5, [$squareCr, $landscapeCr, $pendingSquareCr]);

		$lineItemRepo = Mockery::mock(LineItemRepositoryInterface::class);
		$lineItemRepo->shouldReceive('getActiveLineItemsForScreen')->once()->with(10)->andReturn([$lineItem]);

		$screenService = Mockery::mock(ScreenService::class);
		$screenService->shouldReceive('getScreen')->once()->with(10)->andReturn($screen);

		$service = new PlaylistService($lineItemRepo, $screenService);
		$result = $service->generatePlaylistForScreen(10);

		$this->assertSame(10, $result['screen_id']);
		$this->assertSame(5, $result['venue_id']);
		$this->assertSame('square', $result['orientation']);
		$this->assertSame(1, $result['slots_count']);
		$this->assertSame(1, $result['playlist'][0]['creative_id']);
		$this->assertArrayNotHasKey('tracking', $result['playlist'][0]);
	}

	public function test_skips_line_items_reaching_target_impressions_and_inactive_pivots(): void
	{
		$approvedCr = $this->makeCreative(11, 'approved', 1920, 1080, 20, 'active', 1);
		$inactivePivotCr = $this->makeCreative(12, 'approved', 1920, 1080, 20, 'paused', 1);

		$cappedItem = $this->makeLineItem(201, 1, 'Capped Item', 8, [$approvedCr], 1000, 1000);
		$activeItem = $this->makeLineItem(202, 2, 'Active Item', 5, [$approvedCr, $inactivePivotCr], 1000, 500);

		$lineItemRepo = Mockery::mock(LineItemRepositoryInterface::class);
		$lineItemRepo->shouldReceive('getActiveLineItemsForVenue')->once()->with(3)->andReturn([$cappedItem, $activeItem]);

		$screenService = Mockery::mock(ScreenService::class);

		$service = new PlaylistService($lineItemRepo, $screenService);
		$result = $service->generatePlaylistForVenue(3);

		$this->assertSame(1, $result['slots_count']);
		$this->assertSame(202, $result['playlist'][0]['line_item_id']);
		$this->assertSame(11, $result['playlist'][0]['creative_id']);
	}

	public function test_interleaves_campaigns_round_robin_and_applies_weight(): void
	{
		$crA = $this->makeCreative(21, 'approved', 1920, 1080, 15, 'active', 2);
		$crB = $this->makeCreative(22, 'approved', 1920, 1080, 15, 'active', 2);

		$itemA = $this->makeLineItem(301, 10, 'Campaign A', 8, [$crA]);
		$itemB = $this->makeLineItem(302, 20, 'Campaign B', 7, [$crB]);

		$lineItemRepo = Mockery::mock(LineItemRepositoryInterface::class);
		$lineItemRepo->shouldReceive('getActiveLineItemsForVenue')->once()->with(7)->andReturn([$itemA, $itemB]);

		$screenService = Mockery::mock(ScreenService::class);

		$service = new PlaylistService($lineItemRepo, $screenService);
		$result = $service->generatePlaylistForVenue(7);

		$this->assertSame(4, $result['slots_count']);
		$this->assertSame([10, 20, 10, 20], array_column($result['playlist'], 'campaign_id'));
	}

	protected function makeCreative(int $id, string $status, int $width, int $height, int $duration, string $pivotStatus, int $weight): Creative
	{
		$cr = new Creative([
			'type' => 'video',
			'media_url' => "https://cdn.example.com/cr-{$id}.mp4",
			'width' => $width,
			'height' => $height,
			'duration_seconds' => $duration,
			'status' => $status,
		]);
		$cr->id = $id;
		$cr->setRelation('pivot', (object) ['status' => $pivotStatus, 'weight' => $weight]);

		return $cr;
	}

	protected function makeLineItem(int $id, int $campaignId, string $name, int $priority, array $creatives, int $targetImpressions = 0, int $delivered = 0): LineItem
	{
		$item = new LineItem([
			'campaign_id' => $campaignId,
			'name' => $name,
			'priority' => $priority,
			'target_impressions' => $targetImpressions,
		]);
		$item->id = $id;
		$item->total_delivered_impressions = $delivered;
		$item->setRelation('creatives', collect($creatives));

		return $item;
	}
}
