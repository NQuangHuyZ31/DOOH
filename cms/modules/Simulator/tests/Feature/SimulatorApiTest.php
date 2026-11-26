<?php

namespace Modules\Simulator\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class SimulatorApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		$this->authenticateAsSuperAdmin();
	}

	public function test_simulator_index_returns_module_info(): void
	{
		$this->getJson('/admin/api/simulator')
			->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.module', 'Simulator');
	}

	public function test_sync_device_returns_screen_resource_and_node_api_url(): void
	{
		$venue = Venue::create(['code' => 'VNU-SYNC-01', 'name' => 'Sync Venue', 'city' => 'Hanoi', 'status' => 'active']);
		$secretKey = HmacKeyUtil::generateScopedKey('screen', 'SCR-SYNC-01');
		$screen = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-SYNC-01',
			'name' => 'Sync LED',
			'screen_type' => 'led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => $secretKey,
			'status' => 'active',
		]);

		config()->set('simulator.node_api_url', 'http://localhost:3000');
		$this->getJson('/admin/api/simulator/sync-device?screen_id=' . $screen->id)
			->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.node_api_url', 'http://localhost:3000/api/v1')
			->assertJsonPath('data.screen.code', 'SCR-SYNC-01')
			->assertJsonPath('data.screen.secret_key', $secretKey)
			->assertJsonPath('data.screen.resolution_width', 1920);
	}

	public function test_sync_device_validates_screen_id_and_handles_missing_screen(): void
	{
		$this->getJson('/admin/api/simulator/sync-device')->assertStatus(422);
		$this->getJson('/admin/api/simulator/sync-device?screen_id=99999')->assertStatus(404);
	}

	public function test_parse_vast_validates_url_parameter(): void
	{
		$this->postJson('/admin/api/simulator/parse-vast', ['url' => 'not-a-valid-url'])->assertStatus(422);
	}
}
