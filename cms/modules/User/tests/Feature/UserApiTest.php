<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\User\Models\Permission;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/admin/api/user');
        $response->assertStatus(401);
    }

    public function test_list_users_returns_paginated_resource_structure(): void
    {
        $this->authenticateAsSuperAdmin();

        $role = Role::create([
            'name' => 'operator',
            'display_name' => 'Operator',
        ]);

        User::create([
            'name' => 'John Operator',
            'email' => 'operator@example.com',
            'password' => 'secret123',
            'role_id' => $role->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $response = $this->getJson('/admin/api/user?search=operator');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'role_id',
                        'permission_type',
                        'role',
                        'direct_permissions',
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    public function test_create_user_with_role_mode(): void
    {
        $this->authenticateAsSuperAdmin();

        $role = Role::create([
            'name' => 'manager',
            'display_name' => 'Manager',
        ]);

        $payload = [
            'name' => 'Alice Manager',
            'email' => 'alice@example.com',
            'password' => 'Password123!',
            'role_id' => $role->id,
            'permission_type' => 'role',
        ];

        $response = $this->postJson('/admin/api/user', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Alice Manager')
            ->assertJsonPath('data.permission_type', 'role')
            ->assertJsonPath('data.role.name', 'manager');

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
            'role_id' => $role->id,
        ]);
    }

    public function test_create_user_with_direct_permission_mode(): void
    {
        $this->authenticateAsSuperAdmin();

        Permission::create([
            'name' => 'venue.view',
            'module' => 'venue',
            'display_name' => 'View Venues',
        ]);
        Permission::create([
            'name' => 'venue.create',
            'module' => 'venue',
            'display_name' => 'Create Venues',
        ]);

        $payload = [
            'name' => 'Direct User',
            'email' => 'direct@example.com',
            'password' => 'Password123!',
            'permission_type' => 'direct',
            'direct_permissions' => ['venue.view', 'venue.create'],
        ];

        $response = $this->postJson('/admin/api/user', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.permission_type', 'direct')
            ->assertJsonPath('data.role_id', null)
            ->assertJsonPath('data.direct_permissions.0', 'venue.view')
            ->assertJsonPath('data.direct_permissions.1', 'venue.create');
    }

    public function test_update_user_switches_to_direct_permissions(): void
    {
        $this->authenticateAsSuperAdmin();

        $role = Role::create(['name' => 'staff', 'display_name' => 'Staff']);
        Permission::create(['name' => 'creative.upload', 'module' => 'creative', 'display_name' => 'Upload Creative']);

        $user = User::create([
            'name' => 'Switch User',
            'email' => 'switch@example.com',
            'password' => 'secret123',
            'role_id' => $role->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $response = $this->putJson("/admin/api/user/{$user->id}", [
            'permission_type' => 'direct',
            'direct_permissions' => ['creative.upload'],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.permission_type', 'direct')
            ->assertJsonPath('data.direct_permissions', ['creative.upload']);
    }

    public function test_roles_and_permissions_endpoints(): void
    {
        $this->authenticateAsSuperAdmin();

        Permission::create(['name' => 'core.view', 'module' => 'core', 'display_name' => 'View Core']);

        $roleResponse = $this->getJson('/admin/api/user/role');
        $roleResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $permResponse = $this->getJson('/admin/api/user/permission');
        $permResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }
}
