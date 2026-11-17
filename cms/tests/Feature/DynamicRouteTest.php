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
        $this->artisan('migrate', ['--path' => 'modules/Venue/database/migrations', '--realpath' => false]);
    }

    public function test_spa_root_endpoint(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_venue_module_dispatches_to_venue_controller(): void
    {
        $response = $this->getJson('/api/venue');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');
    }

    public function test_delivery_module_route(): void
    {
        $response = $this->getJson('/api/delivery');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Delivery');
    }

    public function test_creative_module_route(): void
    {
        $response = $this->getJson('/api/creative');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Creative');
    }

    public function test_simulator_module_route(): void
    {
        $response = $this->getJson('/api/simulator');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Simulator');
    }

    public function test_report_module_route(): void
    {
        $response = $this->getJson('/api/report');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Report');
    }

    public function test_log_module_route(): void
    {
        $response = $this->getJson('/api/log');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Log');
    }

    public function test_auth_module_route(): void
    {
        $response = $this->getJson('/api/auth');
        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.module', 'Auth');
    }
}
