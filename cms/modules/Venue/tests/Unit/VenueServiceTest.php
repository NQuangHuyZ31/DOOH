<?php

namespace Modules\Venue\Tests\Unit;

use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
use Modules\User\Services\UserService;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;
use Modules\Venue\Services\VenueService;
use PHPUnit\Framework\TestCase;

class VenueServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_list_venues_delegates_to_repository(): void
    {
        $paginator = new LengthAwarePaginator(collect(['item1', 'item2']), 2, 20, 1);

        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('paginate')->once()->with(20, [])->andReturn($paginator);
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $result = $service->listVenues([], 20);

        $this->assertEquals(2, $result->total());
        $this->assertCount(2, $result->items());
    }

    public function test_get_venue_delegates_to_repository(): void
    {
        $venue = new Venue(['id' => 42, 'name' => 'Mock Venue']);

        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('find')->once()->with(42)->andReturn($venue);
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $result = $service->getVenue(42);

        $this->assertEquals('Mock Venue', $result->name);
    }

    public function test_create_venue_generates_code_if_missing(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('findByCode')->once()->andReturn(null);
        $repoMock->shouldReceive('create')->once()->withArgs(fn (array $data) => !empty($data['code']))->andReturnUsing(fn (array $data) => new Venue($data));
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $created = $service->createVenue(['name' => 'Landmark 81', 'city_province' => 'Ho Chi Minh']);

        $this->assertNotEmpty($created->code);
    }

    public function test_create_venue_preserves_provided_code(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('create')->once()->withArgs(fn (array $data) => $data['code'] === 'CUSTOM-CODE')->andReturnUsing(fn (array $data) => new Venue($data));
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $created = $service->createVenue(['code' => 'custom-code', 'name' => 'Custom Venue']);

        $this->assertEquals('CUSTOM-CODE', $created->code);
    }

    public function test_update_venue_delegates_to_repository(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('update')->once()->with(10, ['name' => 'Renamed Venue', 'code' => 'VNU-01'])->andReturn(true);
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $success = $service->updateVenue(10, ['name' => 'Renamed Venue', 'code' => 'vnu-01']);

        $this->assertTrue($success);
    }

    public function test_delete_venue_delegates_to_repository(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('delete')->once()->with(10)->andReturn(true);
        $userMock = Mockery::mock(UserService::class);

        $service = new VenueService($repoMock, $userMock);
        $success = $service->deleteVenue(10);

        $this->assertTrue($success);
    }

    public function test_get_media_owners_list_delegates_to_user_service(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $userMock = Mockery::mock(UserService::class);
        $userMock->shouldReceive('getMediaOwners')->once()->andReturn([['id' => 1, 'name' => 'Owner 1']]);

        $service = new VenueService($repoMock, $userMock);
        $owners = $service->getMediaOwnersList();

        $this->assertCount(1, $owners);
    }
}
