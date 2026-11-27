<?php

namespace Modules\Venue\Tests\Unit;

use DomainException;
use Illuminate\Database\Eloquent\Collection;
use Mockery;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;
use Modules\Venue\Services\PartnerScreenService;
use Modules\Venue\Services\ScreenService;
use Modules\Venue\Services\VenueService;
use PHPUnit\Framework\TestCase;

class PartnerScreenServiceTest extends TestCase
{
	protected function tearDown(): void
	{
		Mockery::close();
		parent::tearDown();
	}

	public function test_register_screen_rejects_duplicate_hardware_uid(): void
	{
		$screenService = Mockery::mock(ScreenService::class);
		$venueService = Mockery::mock(VenueService::class);
		$screenRepo = Mockery::mock(ScreenRepositoryInterface::class);
		$venueRepo = Mockery::mock(VenueRepositoryInterface::class);

		$screenRepo->shouldReceive('findByOwnerAndHardwareUid')->once()->with(10, 'HW-DUP')->andReturn(new Screen());

		$service = new PartnerScreenService($screenService, $venueService, $screenRepo, $venueRepo);

		$this->expectException(DomainException::class);
		$this->expectExceptionMessage('hardware_device_uid already registered');

		$service->registerScreen(10, [
			'name' => 'LED 01',
			'location_name' => 'Landmark 81',
			'city' => 'Ho Chi Minh',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'hardware_device_uid' => 'HW-DUP',
		]);
	}

	public function test_register_screen_reuses_existing_venue_and_creates_screen(): void
	{
		$screenService = Mockery::mock(ScreenService::class);
		$venueService = Mockery::mock(VenueService::class);
		$screenRepo = Mockery::mock(ScreenRepositoryInterface::class);
		$venueRepo = Mockery::mock(VenueRepositoryInterface::class);

		$venue = new Venue();
		$venue->id = 5;
		$created = new Screen(['code' => 'SCR-SGN-01', 'name' => 'LED 01']);

		$screenRepo->shouldReceive('findByOwnerAndHardwareUid')->once()->with(10, 'HW-OK')->andReturn(null);
		$venueRepo->shouldReceive('findByOwnerAndLocation')->once()->with(10, 'Landmark 81', 'Ho Chi Minh')->andReturn($venue);
		$venueService->shouldNotReceive('createVenue');
		$screenService->shouldReceive('createScreen')->once()->andReturn($created);
		$screenService->shouldReceive('getScreenByCode')->once()->with('SCR-SGN-01')->andReturn($created);

		$service = new PartnerScreenService($screenService, $venueService, $screenRepo, $venueRepo);
		$result = $service->registerScreen(10, [
			'name' => 'LED 01',
			'location_name' => 'Landmark 81',
			'city' => 'Ho Chi Minh',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'hardware_device_uid' => 'HW-OK',
		]);

		$this->assertSame('SCR-SGN-01', $result->code);
	}

	public function test_list_screens_delegates_to_screen_repository(): void
	{
		$screenService = Mockery::mock(ScreenService::class);
		$venueService = Mockery::mock(VenueService::class);
		$screenRepo = Mockery::mock(ScreenRepositoryInterface::class);
		$venueRepo = Mockery::mock(VenueRepositoryInterface::class);

		$expected = new Collection([new Screen(['code' => 'SCR-01'])]);
		$screenRepo->shouldReceive('getByMediaOwner')->once()->with(7)->andReturn($expected);

		$service = new PartnerScreenService($screenService, $venueService, $screenRepo, $venueRepo);
		$this->assertSame($expected, $service->listScreens(7));
	}
}
