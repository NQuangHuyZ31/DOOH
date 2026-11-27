<?php

namespace Modules\Simulator\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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

	public function test_create_local_screen_and_save_synced_credentials(): void
	{
		$createRes = $this->postJson('/admin/api/simulator/screen', [
			'name' => 'Partner Lobby LED',
			'location_name' => 'Landmark 81',
			'city' => 'Ho Chi Minh',
			'screen_type' => 'led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'hardware_device_uid' => 'HW-LM81-01',
		]);

		$createRes->assertStatus(201)
			->assertJsonPath('data.sync_status', 'unsynced')
			->assertJsonPath('data.location_name', 'Landmark 81')
			->assertJsonPath('data.city', 'Ho Chi Minh')
			->assertJsonMissingPath('data.venue_id')
			->assertJsonMissingPath('data.cms_screen_id');

		$simScreenId = $createRes->json('data.id');

		$syncRes = $this->postJson("/admin/api/simulator/screen/{$simScreenId}/sync", [
			'code' => 'SCR-LM81-01',
			'secret_key' => 'dsk_live_secret_01',
		]);

		$syncRes->assertStatus(200)
			->assertJsonPath('data.sync_status', 'synced')
			->assertJsonPath('data.code', 'SCR-LM81-01')
			->assertJsonPath('data.secret_key', 'dsk_live_secret_01');
	}

	public function test_batch_sync_saves_multiple_screen_credentials(): void
	{
		$id1 = $this->postJson('/admin/api/simulator/screen', [
			'name' => 'Batch LED 01',
			'location_name' => 'Vincom',
			'city' => 'Hanoi',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
		])->json('data.id');

		$id2 = $this->postJson('/admin/api/simulator/screen', [
			'name' => 'Batch LED 02',
			'location_name' => 'Vincom',
			'city' => 'Hanoi',
			'resolution_width' => 1080,
			'resolution_height' => 1920,
		])->json('data.id');

		$batchRes = $this->postJson('/admin/api/simulator/screen/batch-sync', [
			'items' => [
				['id' => $id1, 'code' => 'SCR-VC-01', 'secret_key' => 'dsk_batch_01'],
				['id' => $id2, 'code' => 'SCR-VC-02', 'secret_key' => 'dsk_batch_02'],
			],
		]);

		$batchRes->assertStatus(200)
			->assertJsonCount(2, 'data')
			->assertJsonPath('data.0.code', 'SCR-VC-01')
			->assertJsonPath('data.1.code', 'SCR-VC-02');
	}

	public function test_delete_local_simulator_screen(): void
	{
		$simId = $this->postJson('/admin/api/simulator/screen', [
			'name' => 'Temp Screen',
			'location_name' => 'Lotte',
			'city' => 'Hanoi',
			'resolution_width' => 1080,
			'resolution_height' => 1920,
		])->json('data.id');

		$this->deleteJson("/admin/api/simulator/screen/{$simId}")->assertStatus(200);
		$this->getJson('/admin/api/simulator/screen')->assertJsonCount(0, 'data');
	}

	public function test_parse_vast_validates_url_parameter(): void
	{
		$this->postJson('/admin/api/simulator/parse-vast', ['url' => 'not-a-valid-url'])->assertStatus(422);
	}
}
