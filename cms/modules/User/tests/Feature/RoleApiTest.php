<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\Permission;
use Modules\User\Models\Role;
use Tests\TestCase;

class RoleApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/admin/api/user/role');
        $response->assertStatus(401);
    }

    public function test_list_all_roles_without_pagination(): void
    {
        $this->authenticateAsSuperAdmin();

        Role::create(['name' => 'manager', 'display_name' => 'Manager']);

        $response = $this->getJson('/admin/api/user/role');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'display_name', 'description'],
                ],
            ]);
    }

    public function test_list_roles_with_pagination_and_search(): void
    {
        $this->authenticateAsSuperAdmin();

        Role::create(['name' => 'editor', 'display_name' => 'Editor']);
        Role::create(['name' => 'reviewer', 'display_name' => 'Content Reviewer']);

        $response = $this->getJson('/admin/api/user/role?paginate=true&search=Reviewer');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('pagination.total', 1)
            ->assertJsonPath('data.0.name', 'reviewer');
    }

    public function test_create_role_with_permissions(): void
    {
        $this->authenticateAsSuperAdmin();

        $perm = Permission::create([
            'name' => 'venue.view',
            'module' => 'venue',
            'display_name' => 'View Venues',
        ]);

        $payload = [
            'name' => 'venue_manager',
            'display_name' => 'Venue Manager',
            'description' => 'Can manage venues',
            'permissions' => [$perm->id],
        ];

        $response = $this->postJson('/admin/api/user/role', $payload);
        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'venue_manager')
            ->assertJsonPath('data.permissions.0.id', $perm->id);

        $this->assertDatabaseHas('roles', ['name' => 'venue_manager']);
    }

    public function test_update_role(): void
    {
        $this->authenticateAsSuperAdmin();

        $role = Role::create([
            'name' => 'analyst',
            'display_name' => 'Analyst',
        ]);

        $response = $this->putJson("/admin/api/user/role/{$role->id}", [
            'display_name' => 'Senior Analyst',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.display_name', 'Senior Analyst');

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'display_name' => 'Senior Analyst',
        ]);
    }

    public function test_delete_role_prevents_super_admin_deletion(): void
    {
        $this->authenticateAsSuperAdmin();

        $superAdmin = Role::where('name', 'super_admin')->first();
        if ($superAdmin) {
            $response = $this->deleteJson("/admin/api/user/role/{$superAdmin->id}");
            $response->assertStatus(400);
        }

        $normalRole = Role::create([
            'name' => 'temporary',
            'display_name' => 'Temporary Role',
        ]);

        $deleteResponse = $this->deleteJson("/admin/api/user/role/{$normalRole->id}");
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('roles', ['id' => $normalRole->id]);
    }
}
