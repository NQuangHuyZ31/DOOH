<?php

namespace Modules\Core\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Modules\User\Database\Seeders\RolePermissionSeeder;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Tests\TestCase;

class DynamicRouteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_spa_root_endpoint(): void
    {
        $response = $this->get('/');
        $response->assertRedirect('/admin/venues');

        $spa = $this->get('/admin/venues');
        $spa->assertStatus(200);
    }

    public function test_venue_module_dispatches_to_venue_controller(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/venue');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    public function test_delivery_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/delivery');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module', 'Delivery');
    }

    public function test_creative_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/creative');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module', 'Creative');
    }

    public function test_simulator_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/simulator');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module', 'Simulator');
    }

    public function test_report_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/report');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module', 'Report');
    }

    public function test_log_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/log');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.module', 'Log');
    }

    public function test_auth_module_route(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/auth/me');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    public function test_unknown_action_returns_404_json_error(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/venue/non-existent-action');
        $response->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    public function test_rbac_denies_write_action_for_viewer_role_with_403(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $viewerRole = Role::where('name', 'viewer')->firstOrFail();
        $viewer = User::create([
            'name' => 'Report Viewer',
            'email' => 'viewer-test@dooh.media',
            'password' => Hash::make('password123'),
            'role_id' => $viewerRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $this->actingAs($viewer, 'web');

        $readResponse = $this->getJson('/admin/api/venue');
        $readResponse->assertStatus(200);

        $writeResponse = $this->postJson('/admin/api/venue', [
            'code' => 'FORBIDDEN-01',
            'name' => 'Forbidden Venue',
            'location' => 'Hanoi',
            'width' => 1920,
            'height' => 1080,
        ]);
        $writeResponse->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Access denied: insufficient permissions');
    }

    public function test_sanctum_bearer_token_authenticates_protected_module_route(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $viewerRole = Role::where('name', 'viewer')->firstOrFail();
        $viewer = User::create([
            'name' => 'Bearer Viewer',
            'email' => 'bearer-viewer@dooh.media',
            'password' => Hash::make('password123'),
            'role_id' => $viewerRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $token = $viewer->createToken('spa_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/admin/api/venue');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }
}
