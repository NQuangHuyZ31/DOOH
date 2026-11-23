<?php

namespace Modules\Delivery\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Creative\Models\Creative;
use Modules\Delivery\Models\Campaign;
use Modules\Delivery\Models\LineItem;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class DeliveryApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		$this->artisan('migrate');
	}

	public function test_unauthenticated_request_is_rejected_with_401(): void
	{
		$response = $this->getJson('/admin/api/delivery/campaign');
		$response->assertStatus(401)
				 ->assertJsonPath('status', 'error')
				 ->assertJsonPath('message', 'Unauthenticated.');
	}

	public function test_list_campaigns_returns_paginated_json(): void
	{
		$this->authenticateAsSuperAdmin();

		Campaign::create([
			'code' => 'CMP-TEST1',
			'name' => 'Summer Promo Campaign',
			'start_date' => '2026-06-01',
			'end_date' => '2026-06-30',
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/delivery/campaign');
		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonCount(1, 'data')
				 ->assertJsonPath('data.0.code', 'CMP-TEST1');
	}

	public function test_create_campaign_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$response = $this->postJson('/admin/api/delivery/campaign', [
			'name' => 'Autumn Awareness Campaign',
			'start_date' => '2026-09-01',
			'end_date' => '2026-09-30',
			'total_budget' => 50000000.00,
		]);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.name', 'Autumn Awareness Campaign');

		$this->assertDatabaseHas('campaigns', ['name' => 'Autumn Awareness Campaign']);
	}

	public function test_create_campaign_validation_failure(): void
	{
		$this->authenticateAsSuperAdmin();

		$response = $this->postJson('/admin/api/delivery/campaign', [
			'name' => 'Invalid Dates Campaign',
			'start_date' => '2026-09-30',
			'end_date' => '2026-09-01',
		]);

		$response->assertStatus(422)
				 ->assertJsonValidationErrors(['end_date']);
	}

	public function test_get_campaign_by_id(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-GET1',
			'name' => 'Get Single Campaign',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$response = $this->getJson("/admin/api/delivery/campaign/{$campaign->id}");
		$response->assertStatus(200)
				 ->assertJsonPath('data.code', 'CMP-GET1');
	}

	public function test_update_campaign_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-UP1',
			'name' => 'Original Campaign Name',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$response = $this->putJson("/admin/api/delivery/campaign/{$campaign->id}", [
			'name' => 'Updated Campaign Name',
		]);

		$response->assertStatus(200)
				 ->assertJsonPath('data.name', 'Updated Campaign Name');

		$this->assertSame('Updated Campaign Name', $campaign->fresh()->name);
	}

	public function test_delete_campaign_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-DEL1',
			'name' => 'Campaign To Delete',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$response = $this->deleteJson("/admin/api/delivery/campaign/{$campaign->id}");
		$response->assertStatus(200);

		$this->assertSoftDeleted('campaigns', ['id' => $campaign->id]);
	}

	public function test_list_line_items_returns_paginated_json(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-LI-TEST',
			'name' => 'Parent Campaign',
			'start_date' => '2026-01-01',
			'end_date' => '2026-12-31',
			'status' => 'active',
		]);

		LineItem::create([
			'campaign_id' => $campaign->id,
			'code' => 'LI-TEST1',
			'name' => 'Prime Time Slot',
			'priority' => 5,
			'pacing_mode' => 'evenly',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'target_impressions' => 10000,
			'daily_impression_cap' => 1000,
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/delivery/line-item');
		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonCount(1, 'data')
				 ->assertJsonPath('data.0.code', 'LI-TEST1');
	}

	public function test_create_line_item_with_venues_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-LI-CREATE',
			'name' => 'Parent Campaign For LI',
			'start_date' => '2026-01-01',
			'end_date' => '2026-12-31',
			'status' => 'active',
		]);

		$venue = Venue::create([
			'code' => 'VN-DELIV-01',
			'name' => 'Keangnam Landmark LED',
			'status' => 'active',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->postJson('/admin/api/delivery/line-item', [
			'campaign_id' => $campaign->id,
			'name' => 'Evening Prime Banner',
			'priority' => 8,
			'pacing_mode' => 'asap',
			'start_date' => '2026-02-01',
			'end_date' => '2026-02-28',
			'target_impressions' => 20000,
			'daily_impression_cap' => 2000,
			'venue_ids' => [$venue->id],
		]);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.name', 'Evening Prime Banner')
				 ->assertJsonPath('data.priority', 8)
				 ->assertJsonCount(1, 'data.venues');

		$lineItem = LineItem::where('name', 'Evening Prime Banner')->first();
		$this->assertNotNull($lineItem);
		$this->assertTrue($lineItem->venues->contains($venue->id));
	}

	public function test_playlist_preview_generation(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-PL-1',
			'name' => 'Playlist Campaign',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addDays(10)->toDateString(),
			'status' => 'active',
		]);

		$venue = Venue::create([
			'code' => 'VN-PREVIEW-01',
			'name' => 'Lotte Center Screen',
			'status' => 'active',
			'width' => 1920,
			'height' => 1080,
		]);

		$creative = Creative::create([
			'code' => 'CR-PREVIEW-01',
			'name' => 'Brand TVC 15s',
			'type' => 'video',
			'media_url' => 'https://cdn.example.com/tvc.mp4',
			'duration_seconds' => 15,
			'status' => 'approved',
		]);

		$lineItem = LineItem::create([
			'campaign_id' => $campaign->id,
			'creative_id' => $creative->id,
			'code' => 'LI-PL-01',
			'name' => 'Lotte Slot 1',
			'priority' => 5,
			'pacing_mode' => 'evenly',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addDays(10)->toDateString(),
			'target_impressions' => 5000,
			'daily_impression_cap' => 500,
			'status' => 'active',
		]);
		$lineItem->venues()->attach($venue->id);

		$response = $this->getJson("/admin/api/delivery/playlist/preview?venue_id={$venue->id}");
		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.venue_id', $venue->id)
				 ->assertJsonPath('data.slots_count', 1)
				 ->assertJsonPath('data.playlist.0.line_item_id', $lineItem->id)
				 ->assertJsonPath('data.playlist.0.duration', 15)
				 ->assertJsonPath('data.playlist.0.media_url', 'https://cdn.example.com/tvc.mp4');
	}

	public function test_create_line_item_with_multiple_creatives_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-MULTI-CR',
			'name' => 'Multi Creative Campaign',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$c1 = Creative::create([
			'code' => 'CR-M-1',
			'name' => 'Can 1',
			'type' => 'video',
			'media_url' => 'https://cdn.example.com/c1.mp4',
			'status' => 'approved',
		]);
		$c2 = Creative::create([
			'code' => 'CR-M-2',
			'name' => 'Can 2',
			'type' => 'image',
			'media_url' => 'https://cdn.example.com/c2.png',
			'status' => 'approved',
		]);

		$response = $this->postJson('/admin/api/delivery/line-item', [
			'campaign_id' => $campaign->id,
			'name' => 'GAM Multi Creative Item',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'creatives' => [
				['id' => $c1->id, 'weight' => 2],
				['id' => $c2->id, 'weight' => 1],
			],
		]);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonCount(2, 'data.creatives');

		$lineItem = LineItem::where('name', 'GAM Multi Creative Item')->first();
		$this->assertNotNull($lineItem);
		$this->assertCount(2, $lineItem->creatives);
	}

	public function test_batch_create_line_items_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-BATCH-01',
			'name' => 'Batch Campaign',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$response = $this->postJson('/admin/api/delivery/line-item/batch', [
			'items' => [
				[
					'campaign_id' => $campaign->id,
					'name' => 'Batch Item 1',
					'start_date' => '2026-01-01',
					'end_date' => '2026-01-31',
				],
				[
					'campaign_id' => $campaign->id,
					'name' => 'Batch Item 2',
					'start_date' => '2026-01-01',
					'end_date' => '2026-01-31',
				],
			],
		]);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonCount(2, 'data');

		$this->assertDatabaseHas('line_items', ['name' => 'Batch Item 1']);
		$this->assertDatabaseHas('line_items', ['name' => 'Batch Item 2']);
	}

	public function test_playlist_preview_for_screen_with_orientation_matching(): void
	{
		$this->authenticateAsSuperAdmin();

		$venue = Venue::create(['code' => 'VN-SCR-01', 'name' => 'Center Screen Mall', 'status' => 'active']);
		$screen = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-LM-01',
			'name' => 'Main LED Landscape',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'status' => 'active',
		]);

		$campaign = Campaign::create([
			'code' => 'CMP-SCR-01',
			'name' => 'Screen Test Campaign',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addDays(5)->toDateString(),
			'status' => 'active',
		]);

		$landscapeCr = Creative::create([
			'code' => 'CR-LAND-01',
			'name' => 'Horizontal 16:9',
			'type' => 'video',
			'media_url' => 'https://cdn.example.com/land.mp4',
			'width' => 1920,
			'height' => 1080,
			'duration_seconds' => 15,
			'status' => 'approved',
		]);

		$portraitCr = Creative::create([
			'code' => 'CR-PORT-01',
			'name' => 'Vertical 9:16',
			'type' => 'video',
			'media_url' => 'https://cdn.example.com/port.mp4',
			'width' => 1080,
			'height' => 1920,
			'duration_seconds' => 15,
			'status' => 'approved',
		]);

		$lineItem = LineItem::create([
			'campaign_id' => $campaign->id,
			'code' => 'LI-SCR-01',
			'name' => 'Multi Ratio Line Item',
			'orientation' => 'landscape',
			'start_date' => now()->subDay()->toDateString(),
			'end_date' => now()->addDays(5)->toDateString(),
			'status' => 'active',
		]);
		$lineItem->screens()->attach($screen->id);
		$lineItem->creatives()->attach([
			$landscapeCr->id => ['weight' => 1, 'status' => 'active'],
			$portraitCr->id => ['weight' => 1, 'status' => 'active'],
		]);

		$response = $this->getJson("/admin/api/delivery/playlist/preview?screen_id={$screen->id}");
		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.screen_id', $screen->id)
				 ->assertJsonPath('data.slots_count', 1)
				 ->assertJsonPath('data.playlist.0.creative_id', $landscapeCr->id);
	}

	public function test_create_line_item_fails_when_creative_orientation_mismatched(): void
	{
		$this->authenticateAsSuperAdmin();

		$campaign = Campaign::create([
			'code' => 'CMP-MISMATCH',
			'name' => 'Mismatch Campaign',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'status' => 'active',
		]);

		$portraitCr = Creative::create([
			'code' => 'CR-VERT-FAIL',
			'name' => 'Vertical 9:16 Fail',
			'type' => 'video',
			'media_url' => 'https://cdn.example.com/v.mp4',
			'width' => 1080,
			'height' => 1920,
			'status' => 'approved',
		]);

		$response = $this->postJson('/admin/api/delivery/line-item', [
			'campaign_id' => $campaign->id,
			'name' => 'Mismatched Line Item',
			'orientation' => 'landscape',
			'start_date' => '2026-01-01',
			'end_date' => '2026-01-31',
			'creative_ids' => [$portraitCr->id],
		]);

		$response->assertStatus(422)
				 ->assertJsonValidationErrors(['creatives']);
	}
}
