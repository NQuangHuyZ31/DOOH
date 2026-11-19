<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\Permission;
use Tests\TestCase;

class PermissionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/admin/api/user/permission');
        $response->assertStatus(401);
    }

    public function test_list_permissions_without_pagination(): void
    {
        $this->authenticateAsSuperAdmin();

        Permission::create([
            'name' => 'venue.view',
            'module' => 'venue',
            'display_name' => 'View Venues',
        ]);

        $response = $this->getJson('/admin/api/user/permission');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'module', 'display_name', 'description'],
                ],
            ]);
    }

    public function test_list_permissions_with_pagination_and_filters(): void
    {
        $this->authenticateAsSuperAdmin();

        Permission::create([
            'name' => 'venue.create',
            'module' => 'venue',
            'display_name' => 'Create Venues',
        ]);
        Permission::create([
            'name' => 'creative.upload',
            'module' => 'creative',
            'display_name' => 'Upload Creatives',
        ]);

        $response = $this->getJson('/admin/api/user/permission?paginate=true&module=creative');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.name', 'creative.upload');

        $searchResponse = $this->getJson('/admin/api/user/permission?paginate=true&search=venues');
        $searchResponse->assertStatus(200)
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.name', 'venue.create');
    }

    public function test_list_permissions_grouped_by_module(): void
    {
        $this->authenticateAsSuperAdmin();

        Permission::create([
            'name' => 'report.view',
            'module' => 'report',
            'display_name' => 'View Reports',
        ]);

        $response = $this->getJson('/admin/api/user/permission?grouped=true');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'report' => [
                        '*' => ['id', 'name', 'module', 'display_name'],
                    ],
                ],
            ]);
    }

    public function test_create_permission(): void
    {
        $this->authenticateAsSuperAdmin();

        $payload = [
            'name' => 'report.download',
            'module' => 'report',
            'display_name' => 'Download Reports',
            'description' => 'Allow downloading analytical reports',
        ];

        $response = $this->postJson('/admin/api/user/permission', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'report.download')
            ->assertJsonPath('data.module', 'report');

        $this->assertDatabaseHas('permissions', ['name' => 'report.download']);
    }

    public function test_update_permission(): void
    {
        $this->authenticateAsSuperAdmin();

        $perm = Permission::create([
            'name' => 'simulator.test',
            'module' => 'simulator',
            'display_name' => 'Test Simulator',
        ]);

        $response = $this->putJson("/admin/api/user/permission/{$perm->id}", [
            'display_name' => 'Updated Simulator Test',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.display_name', 'Updated Simulator Test');

        $this->assertDatabaseHas('permissions', [
            'id' => $perm->id,
            'display_name' => 'Updated Simulator Test',
        ]);
    }

    public function test_delete_permission(): void
    {
        $this->authenticateAsSuperAdmin();

        $perm = Permission::create([
            'name' => 'temp.action',
            'module' => 'temp',
            'display_name' => 'Temporary Action',
        ]);

        $response = $this->deleteJson("/admin/api/user/permission/{$perm->id}");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('permissions', ['id' => $perm->id]);
    }
}
