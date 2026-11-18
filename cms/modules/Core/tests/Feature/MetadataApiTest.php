<?php

namespace Modules\Core\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\User\Database\Seeders\RolePermissionSeeder;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Tests\TestCase;

class MetadataApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/admin/api/core/metadata');

        $response->assertStatus(401)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_authenticated_super_admin_receives_full_metadata(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/core/metadata');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Metadata retrieved successfully.')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'app' => [
                        'default_module',
                        'timezone',
                        'modules',
                    ],
                    'pagination' => [
                        'default_per_page',
                        'per_page_options',
                    ],
                    'statuses' => [
                        'common',
                        'tags',
                    ],
                    'enums',
                ],
            ]);
    }

    public function test_authenticated_user_without_core_permission_can_access_metadata(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $viewerRole = Role::where('name', 'viewer')->firstOrFail();
        $viewer = User::create([
            'name' => 'Metadata Viewer',
            'email' => 'metadata-viewer@dooh.media',
            'password' => Hash::make('password123'),
            'role_id' => $viewerRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $this->actingAs($viewer, 'web');

        $response = $this->getJson('/admin/api/core/metadata');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.pagination.default_per_page', 10);
    }

    public function test_metadata_endpoint_filters_by_keys_query_param(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/core/metadata?keys=statuses,enums');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'statuses',
                    'enums',
                ],
            ])
            ->assertJsonMissingPath('data.app')
            ->assertJsonMissingPath('data.pagination');
    }
}
