<?php

namespace Modules\Venue\Tests\Unit;

use Illuminate\Pagination\LengthAwarePaginator;
use Mockery;
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
        $paginator = new LengthAwarePaginator(collect(['item1', 'item2']), 2, 20);

        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('paginate')
                 ->once()
                 ->with(20)
                 ->andReturn($paginator);

        $service = new VenueService($repoMock);
        $result = $service->listVenues(20);

        $this->assertEquals(2, $result->total());
        $this->assertCount(2, $result->items());
    }

    public function test_get_venue_delegates_to_repository(): void
    {
        $venue = new Venue(['id' => 42, 'name' => 'Mock Screen']);

        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('find')
                 ->once()
                 ->with(42)
                 ->andReturn($venue);

        $service = new VenueService($repoMock);
        $result = $service->getVenue(42);

        $this->assertEquals('Mock Screen', $result->name);
    }

    public function test_create_venue_generates_secret_key_if_missing(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('create')
                 ->once()
                 ->withArgs(function (array $data) {
                     return isset($data['secret_key'])
                         && str_starts_with($data['secret_key'], 'sec_')
                         && strlen($data['secret_key']) > 10
                         && $data['code'] === 'SCREEN-AUTO-SEC';
                 })
                 ->andReturnUsing(fn (array $data) => new Venue($data));

        $service = new VenueService($repoMock);
        $created = $service->createVenue([
            'code' => 'SCREEN-AUTO-SEC',
            'name' => 'Auto Secret Screen',
        ]);

        $this->assertNotNull($created->secret_key);
        $this->assertStringStartsWith('sec_', $created->secret_key);
    }

    public function test_create_venue_preserves_provided_secret_key(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('create')
                 ->once()
                 ->withArgs(function (array $data) {
                     return $data['secret_key'] === 'custom_secret_key_123';
                 })
                 ->andReturnUsing(fn (array $data) => new Venue($data));

        $service = new VenueService($repoMock);
        $created = $service->createVenue([
            'code' => 'SCREEN-CUSTOM-SEC',
            'secret_key' => 'custom_secret_key_123',
        ]);

        $this->assertEquals('custom_secret_key_123', $created->secret_key);
    }

    public function test_update_venue_delegates_to_repository(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('update')
                 ->once()
                 ->with(10, ['name' => 'Renamed Screen'])
                 ->andReturn(true);

        $service = new VenueService($repoMock);
        $success = $service->updateVenue(10, ['name' => 'Renamed Screen']);

        $this->assertTrue($success);
    }

    public function test_delete_venue_delegates_to_repository(): void
    {
        $repoMock = Mockery::mock(VenueRepositoryInterface::class);
        $repoMock->shouldReceive('delete')
                 ->once()
                 ->with(10)
                 ->andReturn(true);

        $service = new VenueService($repoMock);
        $success = $service->deleteVenue(10);

        $this->assertTrue($success);
    }
}
