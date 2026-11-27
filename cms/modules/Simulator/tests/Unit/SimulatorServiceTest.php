<?php

namespace Modules\Simulator\Tests\Unit;

use Mockery;
use Modules\Creative\Services\VastParserService;
use Modules\Simulator\Models\SimulatorScreen;
use Modules\Simulator\Repositories\Interfaces\SimulatorScreenRepositoryInterface;
use Modules\Simulator\Services\SimulatorService;
use PHPUnit\Framework\TestCase;

class SimulatorServiceTest extends TestCase
{
	protected function tearDown(): void
	{
		Mockery::close();
		parent::tearDown();
	}

	public function test_create_local_screen_derives_orientation_and_sets_unsynced(): void
	{
		$repo = Mockery::mock(SimulatorScreenRepositoryInterface::class);
		$vast = Mockery::mock(VastParserService::class);
		$expected = new SimulatorScreen(['name' => 'LED 01', 'orientation' => 'landscape', 'aspect_ratio' => '16:9', 'sync_status' => 'unsynced']);

		$repo->shouldReceive('create')
			->once()
			->withArgs(fn (array $data) => $data['orientation'] === 'landscape' && $data['aspect_ratio'] === '16:9' && $data['sync_status'] === 'unsynced')
			->andReturn($expected);

		$service = new SimulatorService($repo, $vast);
		$result = $service->createLocalScreen(['name' => 'LED 01', 'location_name' => 'Landmark 81', 'city' => 'Ho Chi Minh', 'resolution_width' => 1920, 'resolution_height' => 1080]);

		$this->assertSame('unsynced', $result->sync_status);
		$this->assertSame('landscape', $result->orientation);
	}

	public function test_mark_screen_synced_returns_null_when_not_found(): void
	{
		$repo = Mockery::mock(SimulatorScreenRepositoryInterface::class);
		$vast = Mockery::mock(VastParserService::class);
		$repo->shouldReceive('find')->once()->with(999)->andReturn(null);

		$service = new SimulatorService($repo, $vast);
		$this->assertNull($service->markScreenSynced(999, 'SCR-01', 'dsk_123'));
	}

	public function test_mark_screen_synced_updates_credentials(): void
	{
		$repo = Mockery::mock(SimulatorScreenRepositoryInterface::class);
		$vast = Mockery::mock(VastParserService::class);
		$existing = new SimulatorScreen(['name' => 'LED 01']);
		$updated = new SimulatorScreen(['name' => 'LED 01', 'sync_status' => 'synced', 'synced_code' => 'SCR-01', 'synced_secret_key' => 'dsk_123']);

		$repo->shouldReceive('find')->twice()->with(5)->andReturn($existing, $updated);
		$repo->shouldReceive('update')
			->once()
			->withArgs(fn ($id, array $data) => $id === 5 && $data['sync_status'] === 'synced' && $data['synced_code'] === 'SCR-01' && $data['synced_secret_key'] === 'dsk_123')
			->andReturn(true);

		$service = new SimulatorService($repo, $vast);
		$result = $service->markScreenSynced(5, ' SCR-01 ', ' dsk_123 ');

		$this->assertSame('synced', $result?->sync_status);
		$this->assertSame('SCR-01', $result?->synced_code);
	}

	public function test_parse_vast_tag_delegates_to_vast_parser_service(): void
	{
		$repo = Mockery::mock(SimulatorScreenRepositoryInterface::class);
		$vast = Mockery::mock(VastParserService::class);

		$vast->shouldReceive('parse')
			->once()
			->with('https://ads.example.com/vast?ts=[TIMESTAMP]')
			->andReturn(['primary_media_url' => 'https://cdn.example.com/ad.mp4']);

		$service = new SimulatorService($repo, $vast);
		$parsed = $service->parseVastTag('https://ads.example.com/vast?ts=[TIMESTAMP]');

		$this->assertSame('https://cdn.example.com/ad.mp4', $parsed['primary_media_url']);
	}
}
