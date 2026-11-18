<?php

namespace Modules\Core\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\User\Database\Seeders\RolePermissionSeeder;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class FilterableTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_filter_exact_match(): void
    {
        User::create([
            'name' => 'Alice Role',
            'email' => 'alice@dooh.media',
            'password' => Hash::make('password123'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        User::create([
            'name' => 'Bob Direct',
            'email' => 'bob@dooh.media',
            'password' => Hash::make('password123'),
            'permission_type' => User::PERMISSION_TYPE_DIRECT,
        ]);

        $results = User::query()->filter(['permission_type' => 'direct'])->get();

        $this->assertCount(1, $results);
        $this->assertSame('bob@dooh.media', $results->first()->email);
    }

    public function test_filter_multi_column_search(): void
    {
        User::create([
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'password' => Hash::make('password123'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        User::create([
            'name' => 'Sarah Connor',
            'email' => 'skynet-fighter@example.com',
            'password' => Hash::make('password123'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        // Search by name
        $nameResults = User::query()->filter(['search' => 'John'])->get();
        $this->assertCount(1, $nameResults);
        $this->assertSame('John Doe', $nameResults->first()->name);

        // Search by email
        $emailResults = User::query()->filter(['search' => 'skynet'])->get();
        $this->assertCount(1, $emailResults);
        $this->assertSame('Sarah Connor', $emailResults->first()->name);
    }

    public function test_filter_relationship_dot_notation(): void
    {
        $viewerRole = Role::where('name', 'viewer')->firstOrFail();
        $adminRole = Role::where('name', 'admin')->firstOrFail();

        $user1 = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer@example.com',
            'password' => Hash::make('password123'),
            'role_id' => $viewerRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $user2 = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role_id' => $adminRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $results = User::query()->filter(['role' => 'viewer'])->get();

        $this->assertCount(1, $results);
        $this->assertSame('viewer@example.com', $results->first()->email);
    }

    public function test_filter_skips_empty_values_and_unknown_keys(): void
    {
        User::create([
            'name' => 'Active User',
            'email' => 'active@example.com',
            'password' => Hash::make('password123'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        // Empty string, null, array, and non-filterable keys should be ignored
        $results = User::query()->filter([
            'search' => '',
            'role' => null,
            'non_existent_column' => 'some_value',
            'empty_array' => [],
        ])->get();

        $this->assertCount(1, $results);
    }

    public function test_venue_model_filter_integration(): void
    {
        Venue::create([
            'code' => 'HN-01',
            'name' => 'Keangnam Landmark',
            'location' => 'Cau Giay, Hanoi',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_1',
        ]);

        Venue::create([
            'code' => 'HCM-02',
            'name' => 'Bitexco Tower',
            'location' => 'District 1, HCMC',
            'width' => 1080,
            'height' => 1920,
            'orientation' => 'portrait',
            'status' => 'maintenance',
            'secret_key' => 'sec_2',
        ]);

        $landscapeVenues = Venue::query()->filter(['orientation' => 'landscape'])->get();
        $this->assertCount(1, $landscapeVenues);
        $this->assertSame('HN-01', $landscapeVenues->first()->code);

        $searchVenues = Venue::query()->filter(['search' => 'Bitexco'])->get();
        $this->assertCount(1, $searchVenues);
        $this->assertSame('HCM-02', $searchVenues->first()->code);
    }
}
