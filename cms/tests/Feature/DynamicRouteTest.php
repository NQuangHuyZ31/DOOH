<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
