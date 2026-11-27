<?php

namespace Modules\Venue\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\User;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class InternalVenueApiTest extends TestCase
{
	use RefreshDatabase;

	protected array $headers = ['X-INTERNAL-SECRET' => 'test-internal-venue-secret'];

	protected function setUp(): void
	{
		parent::setUp();
		config()->set('modules.internal_secret', 'test-internal-venue-secret');
	}

	protected function createOwner(string $email): User
	{
		return User::create([
			'name' => 'Owner ' . $email,
			'email' => $email,
			'password' => bcrypt('password123'),
			'permission_type' => 'role',
		]);
	}

	public function test_internal_venue_endpoints_reject_missing_secret(): void
	{
		$this->postJson('/admin/api/internal/venue/screens', [])->assertStatus(401);
		$this->postJson('/admin/api/internal/venue/screens/batch', [])->assertStatus(401);
		$this->getJson('/admin/api/internal/venue/screens?vendor_id=1')->assertStatus(401);
		$this->getJson('/admin/api/internal/venue/screens/config?code=SCR-01')->assertStatus(401);
		$this->postJson('/admin/api/internal/venue/screens/heartbeat', [])->assertStatus(401);
	}

	public function test_register_screen_creates_and_reuses_venue_without_exposing_internal_ids(): void
	{
		$owner = $this->createOwner('partner1@dooh.test');

		$first = $this->postJson('/admin/api/internal/venue/screens', [
			'vendor_id' => $owner->id,
			'name' => 'Lobby LED 01',
			'location_name' => 'Landmark 81',
			'city' => 'Ho Chi Minh',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'opening_time' => '07:30:00',
			'closing_time' => '22:30:00',
			'is_24_7' => false,
			'hardware_device_uid' => 'HW-LM81-01',
		], $this->headers);

		$first->assertStatus(201)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.name', 'Lobby LED 01')
			->assertJsonPath('data.location_name', 'Landmark 81')
			->assertJsonPath('data.city', 'Ho Chi Minh')
			->assertJsonPath('data.orientation', 'landscape')
			->assertJsonPath('data.aspect_ratio', '16:9')
			->assertJsonPath('data.opening_time', '07:30:00')
			->assertJsonPath('data.closing_time', '22:30:00')
			->assertJsonPath('data.is_24_7', false)
			->assertJsonMissingPath('data.venue_id')
			->assertJsonMissingPath('data.screen_id');

		$this->assertNotEmpty($first->json('data.code'));
		$this->assertNotEmpty($first->json('data.secret_key'));

		// Register second screen at same location -> reuses existing Venue
		$second = $this->postJson('/admin/api/internal/venue/screens', [
			'vendor_id' => $owner->id,
			'name' => 'Lobby LED 02',
			'location_name' => 'landmark 81',
			'city' => 'ho chi minh',
			'resolution_width' => 1080,
			'resolution_height' => 1920,
			'hardware_device_uid' => 'HW-LM81-02',
		], $this->headers);

		$second->assertStatus(201)->assertJsonPath('data.orientation', 'portrait');
		$this->assertEquals(1, Venue::where('media_owner_id', $owner->id)->count());
		$this->assertEquals(2, Screen::count());

		// Duplicate hardware_device_uid -> 409 Conflict
		$dup = $this->postJson('/admin/api/internal/venue/screens', [
			'vendor_id' => $owner->id,
			'name' => 'Lobby LED Duplicate',
			'location_name' => 'Landmark 81',
			'city' => 'Ho Chi Minh',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'hardware_device_uid' => 'HW-LM81-01',
		], $this->headers);

		$dup->assertStatus(409);
	}

	public function test_batch_register_returns_partial_success_and_isolates_list_by_vendor(): void
	{
		$ownerA = $this->createOwner('owner-a@dooh.test');
		$ownerB = $this->createOwner('owner-b@dooh.test');

		$batch = $this->postJson('/admin/api/internal/venue/screens/batch', [
			'vendor_id' => $ownerA->id,
			'screens' => [
				[
					'name' => 'Batch Screen 1',
					'location_name' => 'Vincom Dong Khoi',
					'city' => 'Ho Chi Minh',
					'resolution_width' => 1920,
					'resolution_height' => 1080,
					'hardware_device_uid' => 'HW-B-01',
				],
				[
					'name' => 'Batch Screen Duplicate',
					'location_name' => 'Vincom Dong Khoi',
					'city' => 'Ho Chi Minh',
					'resolution_width' => 1920,
					'resolution_height' => 1080,
					'hardware_device_uid' => 'HW-B-01',
				],
				[
					'name' => '',
					'location_name' => 'Invalid Screen',
					'city' => 'Hanoi',
					'resolution_width' => 50,
					'resolution_height' => 50,
				],
			],
		], $this->headers);

		$batch->assertStatus(200)
			->assertJsonPath('data.total', 3)
			->assertJsonPath('data.created_count', 1)
			->assertJsonPath('data.failed_count', 2)
			->assertJsonPath('data.created.0.index', 0)
			->assertJsonPath('data.failed.0.index', 1)
			->assertJsonPath('data.failed.1.index', 2);

		$listA = $this->getJson('/admin/api/internal/venue/screens?vendor_id=' . $ownerA->id, $this->headers);
		$listA->assertStatus(200)->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.secret_key');

		$listB = $this->getJson('/admin/api/internal/venue/screens?vendor_id=' . $ownerB->id, $this->headers);
		$listB->assertStatus(200)->assertJsonCount(0, 'data');
	}

	public function test_screen_config_and_heartbeat_endpoints(): void
	{
		$owner = $this->createOwner('hb-owner@dooh.test');
		$registered = $this->postJson('/admin/api/internal/venue/screens', [
			'vendor_id' => $owner->id,
			'name' => 'Elevator Display',
			'location_name' => 'Bitexco',
			'city' => 'Ho Chi Minh',
			'resolution_width' => 1080,
			'resolution_height' => 1920,
		], $this->headers);
		$code = $registered->json('data.code');

		$cfg = $this->getJson('/admin/api/internal/venue/screens/config?code=' . $code, $this->headers);
		$cfg->assertStatus(200)
			->assertJsonPath('data.code', $code)
			->assertJsonPath('data.location_name', 'Bitexco')
			->assertJsonMissingPath('data.secret_key');

		$hb = $this->postJson('/admin/api/internal/venue/screens/heartbeat', [
			'code' => $code,
			'player_app_version' => '1.4.2',
			'ip_address' => '10.0.0.5',
			'storage_free_mb' => 4096,
		], $this->headers);

		$hb->assertStatus(200)
			->assertJsonPath('data.code', $code)
			->assertJsonPath('data.connectivity_status', 'online');

		$screen = Screen::where('code', $code)->first();
		$this->assertEquals('online', $screen->connectivity_status);
		$this->assertEquals('1.4.2', $screen->player_app_version);
		$this->assertEquals(4096, $screen->storage_free_mb);
		$this->assertNotNull($screen->last_heartbeat_at);
	}
}
