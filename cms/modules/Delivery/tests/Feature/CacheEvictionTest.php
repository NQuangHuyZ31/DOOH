<?php

namespace Modules\Delivery\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Creative\Models\Creative;
use Modules\Creative\Services\CreativeService;
use Modules\Delivery\Models\Campaign;
use Modules\Delivery\Services\DeliveryService;
use Modules\Vendor\Models\Vendor;
use Modules\Vendor\Services\VendorService;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Modules\Venue\Services\ScreenService;
use Tests\TestCase;

class CacheEvictionTest extends TestCase
{
	use RefreshDatabase;

	private array $evictedKeys = [];

	protected function setUp(): void
	{
		parent::setUp();
		$this->evictedKeys = [];

		Redis::shouldReceive('del')->andReturnUsing(function ($keys) {
			foreach ((array) $keys as $k) {
				$this->evictedKeys[] = $k;
			}

			return count((array) $keys);
		});
	}

	public function test_vendor_key_rotation_and_update_evicts_vendor_auth_cache(): void
	{
		$keyData = HmacKeyUtil::generatePrefixedKey('dooh_live_');
		$vendor = Vendor::create([
			'code' => 'VND-EVICT-01',
			'name' => 'Evict Partner',
			'contact_name' => 'Bob',
			'contact_email' => 'bob@evict.test',
			'api_key_hash' => $keyData['hash'],
			'api_key_prefix' => $keyData['prefix'],
			'status' => 'active',
		]);

		/** @var VendorService $service */
		$service = app(VendorService::class);
		$service->regenerateApiKey($vendor->id);

		$this->assertContains('vendor:auth:' . $keyData['hash'], $this->evictedKeys);
	}

	public function test_screen_key_rotation_and_code_update_evicts_screen_auth_and_playlist(): void
	{
		$venue = Venue::create(['code' => 'VNU-EV-01', 'name' => 'Venue 1', 'city' => 'Hanoi', 'status' => 'active']);
		$screen = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-EV-01',
			'name' => 'LED 1',
			'screen_type' => 'led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => HmacKeyUtil::generateScopedKey('screen', 'SCR-EV-01'),
			'status' => 'active',
		]);

		/** @var ScreenService $service */
		$service = app(ScreenService::class);
		$service->regenerateSecretKey($screen->id);

		$this->assertContains("playlist:screen:{$screen->id}", $this->evictedKeys);
		$this->assertContains('screen:auth:SCR-EV-01', $this->evictedKeys);

		$this->evictedKeys = [];
		$service->updateScreen($screen->id, ['code' => 'SCR-EV-01-NEW']);

		$this->assertContains('screen:auth:SCR-EV-01', $this->evictedKeys);
		$this->assertContains('screen:auth:SCR-EV-01-NEW', $this->evictedKeys);
		$this->assertContains("playlist:screen:{$screen->id}", $this->evictedKeys);
	}

	public function test_line_item_and_creative_changes_evict_only_affected_screens_and_venues(): void
	{
		$venue = Venue::create(['code' => 'VNU-EV-02', 'name' => 'Venue 2', 'city' => 'HCMC', 'status' => 'active']);
		$screenA = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-A',
			'name' => 'Screen A',
			'screen_type' => 'led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => HmacKeyUtil::generateScopedKey('screen', 'SCR-A'),
			'status' => 'active',
		]);
		$screenB = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-B',
			'name' => 'Screen B (Unrelated)',
			'screen_type' => 'led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => HmacKeyUtil::generateScopedKey('screen', 'SCR-B'),
			'status' => 'active',
		]);

		$campaign = Campaign::create([
			'code' => 'CMP-EV-01',
			'name' => 'Campaign Evict',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addWeek()->toDateString(),
			'status' => 'active',
		]);
		$creative = Creative::create([
			'code' => 'CR-EV-01',
			'name' => 'Ad Video',
			'type' => 'video',
			'media_url' => 'https://cdn.test/ad.mp4',
			'duration_seconds' => 15,
			'width' => 1920,
			'height' => 1080,
			'status' => 'pending_review',
		]);

		/** @var DeliveryService $deliveryService */
		$deliveryService = app(DeliveryService::class);
		$deliveryService->createLineItem([
			'campaign_id' => $campaign->id,
			'name' => 'LI Evict',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addWeek()->toDateString(),
			'daily_impression_cap' => 500,
			'venue_ids' => [$venue->id],
			'screen_ids' => [$screenA->id],
			'creative_ids' => [$creative->id],
		]);

		$this->assertContains("playlist:screen:{$screenA->id}", $this->evictedKeys);
		$this->assertContains("playlist:venue:{$venue->id}", $this->evictedKeys);
		$this->assertNotContains("playlist:screen:{$screenB->id}", $this->evictedKeys);

		// Approving the creative dispatches CreativeChanged -> evicts only Screen A & Venue, NOT Screen B
		$this->evictedKeys = [];
		/** @var CreativeService $creativeService */
		$creativeService = app(CreativeService::class);
		$creativeService->reviewCreative($creative->id, 'approved');

		$this->assertContains("playlist:screen:{$screenA->id}", $this->evictedKeys);
		$this->assertContains("playlist:venue:{$venue->id}", $this->evictedKeys);
		$this->assertNotContains("playlist:screen:{$screenB->id}", $this->evictedKeys);
	}
}
