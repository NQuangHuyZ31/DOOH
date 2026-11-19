<?php

namespace Modules\Venue\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Venue\Models\Venue;
use Modules\Venue\Repositories\VenueRepository;
use Tests\TestCase;

class VenueRepositoryTest extends TestCase
{
    use RefreshDatabase;

    protected VenueRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->repository = new VenueRepository(new Venue());
    }

    public function test_repository_creates_and_finds_by_code(): void
    {
        $venue = $this->repository->create([
            'code' => 'REPO-01',
            'name' => 'Repository Venue Test',
            'venue_type' => 'shopping_mall',
            'address' => '123 Main St',
            'city_province' => 'Ho Chi Minh City',
            'status' => 'active',
        ]);

        $this->assertNotNull($venue->id);

        $found = $this->repository->findByCode('REPO-01');

        $this->assertNotNull($found);
        $this->assertEquals($venue->id, $found->id);
        $this->assertEquals('Repository Venue Test', $found->name);
    }

    public function test_repository_paginate_returns_length_aware_paginator(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->repository->create([
                'code' => "VENUE-PAG-0{$i}",
                'name' => "Venue {$i}",
                'status' => 'active',
            ]);
        }

        $paginator = $this->repository->paginate(2, []);

        $this->assertEquals(5, $paginator->total());
        $this->assertCount(2, $paginator->items());
        $this->assertEquals(1, $paginator->currentPage());
        $this->assertEquals(3, $paginator->lastPage());
    }

    public function test_repository_updates_venue(): void
    {
        $venue = $this->repository->create([
            'code' => 'UP-01',
            'name' => 'Original Name',
            'status' => 'active',
        ]);

        $updated = $this->repository->update($venue->id, [
            'name' => 'Updated Venue Name',
            'status' => 'inactive',
        ]);

        $this->assertTrue($updated);

        $fresh = $this->repository->find($venue->id);
        $this->assertEquals('Updated Venue Name', $fresh->name);
        $this->assertEquals('inactive', $fresh->status);
    }

    public function test_repository_deletes_venue(): void
    {
        $venue = $this->repository->create([
            'code' => 'DEL-01',
            'name' => 'To be deleted',
            'status' => 'active',
        ]);

        $deleted = $this->repository->delete($venue->id);
        $this->assertTrue($deleted);

        $found = $this->repository->find($venue->id);
        $this->assertNull($found);

        $this->assertSoftDeleted('venues', ['id' => $venue->id]);
    }
}
