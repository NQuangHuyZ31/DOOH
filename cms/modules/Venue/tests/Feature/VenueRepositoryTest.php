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
            'name' => 'Repository Screen Test',
            'location' => 'Zone B',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_repo123',
        ]);

        $this->assertNotNull($venue->id);

        $found = $this->repository->findByCode('REPO-01');

        $this->assertNotNull($found);
        $this->assertEquals($venue->id, $found->id);
        $this->assertEquals('Repository Screen Test', $found->name);
    }

    public function test_repository_paginate_returns_length_aware_paginator(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->repository->create([
                'code' => "SCREEN-PAG-0{$i}",
                'name' => "Screen {$i}",
                'location' => "Floor {$i}",
                'width' => 1920,
                'height' => 1080,
                'status' => 'active',
                'secret_key' => "sec_p{$i}",
            ]);
        }

        $paginated = $this->repository->paginate(2);

        $this->assertEquals(2, $paginated->perPage());
        $this->assertEquals(5, $paginated->total());
        $this->assertEquals(3, $paginated->lastPage());
        $this->assertCount(2, $paginated->items());
    }

    public function test_repository_update_modifies_record(): void
    {
        $venue = $this->repository->create([
            'code' => 'UPDATE-REPO',
            'name' => 'Initial Name',
            'location' => 'Initial Location',
            'width' => 1920,
            'height' => 1080,
            'status' => 'active',
            'secret_key' => 'sec_up_repo',
        ]);

        $updated = $this->repository->update($venue->id, [
            'name' => 'Changed Name',
            'status' => 'inactive',
        ]);

        $this->assertTrue($updated);

        $refreshed = $this->repository->find($venue->id);
        $this->assertEquals('Changed Name', $refreshed->name);
        $this->assertEquals('inactive', $refreshed->status);
    }

    public function test_repository_delete_removes_record(): void
    {
        $venue = $this->repository->create([
            'code' => 'DEL-REPO',
            'name' => 'Delete Repo Screen',
            'location' => 'To remove',
            'width' => 1920,
            'height' => 1080,
            'status' => 'active',
            'secret_key' => 'sec_del_repo',
        ]);

        $deleted = $this->repository->delete($venue->id);

        $this->assertTrue($deleted);
        $this->assertNull($this->repository->find($venue->id));
    }
}
