<?php

namespace Modules\Venue\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class VenueApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->getJson('/admin/api/venue');
        $response->assertStatus(401)
                 ->assertJsonPath('status', 'error')
                 ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_list_venues_returns_paginated_json(): void
    {
        $this->authenticateAsSuperAdmin();

        Venue::create([
            'code' => 'TEST-01',
            'name' => 'Screen Alpha',
            'location' => 'Building A, Lobby',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_alpha123',
        ]);

        $response = $this->getJson('/admin/api/venue');

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.code', 'TEST-01')
                 ->assertJsonStructure([
                     'status',
                     'message',
                     'data',
                     'pagination' => [
                         'current_page',
                         'last_page',
                         'per_page',
                         'total',
                     ],
                 ]);
    }

    public function test_create_venue_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $payload = [
            'code' => 'HN-CG-01',
            'name' => 'Cau Giay LED Billboard',
            'location' => 'Cau Giay, Hanoi',
            'width' => 3840,
            'height' => 2160,
            'orientation' => 'landscape',
            'status' => 'active',
        ];

        $response = $this->postJson('/admin/api/venue', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.code', 'HN-CG-01')
                 ->assertJsonPath('data.name', 'Cau Giay LED Billboard');

        $this->assertDatabaseHas('venues', [
            'code' => 'HN-CG-01',
            'name' => 'Cau Giay LED Billboard',
        ]);
    }

    public function test_create_venue_validation_failure_on_missing_fields(): void
    {
        $this->authenticateAsSuperAdmin();

        // Missing required fields: code, name, location, width, height
        $response = $this->postJson('/admin/api/venue', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['code', 'name', 'location', 'width', 'height']);
    }

    public function test_create_venue_validation_failure_on_duplicate_code(): void
    {
        $this->authenticateAsSuperAdmin();

        Venue::create([
            'code' => 'UNIQUE-01',
            'name' => 'Existing Screen',
            'location' => 'Zone 1',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_unique123',
        ]);

        $response = $this->postJson('/admin/api/venue', [
            'code' => 'UNIQUE-01',
            'name' => 'Duplicate Code Screen',
            'location' => 'Zone 2',
            'width' => 1920,
            'height' => 1080,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['code']);
    }

    public function test_get_venue_by_id_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SHOW-01',
            'name' => 'Show Venue Test',
            'location' => 'Floor 10',
            'width' => 1080,
            'height' => 1920,
            'orientation' => 'portrait',
            'status' => 'active',
            'secret_key' => 'sec_show123',
        ]);

        $response = $this->getJson("/admin/api/venue/{$venue->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.id', $venue->id)
                 ->assertJsonPath('data.code', 'SHOW-01')
                 ->assertJsonPath('data.orientation', 'portrait');
    }

    public function test_get_venue_not_found_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/venue/999999');

        $response->assertStatus(404)
                 ->assertJsonPath('status', 'error')
                 ->assertJsonPath('message', 'Venue not found');
    }

    public function test_update_venue_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'UPDATE-01',
            'name' => 'Original Name',
            'location' => 'Original Location',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_update123',
        ]);

        $response = $this->putJson("/admin/api/venue/{$venue->id}", [
            'name' => 'Updated Screen Name',
            'status' => 'maintenance',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('venues', [
            'id' => $venue->id,
            'name' => 'Updated Screen Name',
            'status' => 'maintenance',
        ]);
    }

    public function test_delete_venue_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'DELETE-01',
            'name' => 'To Be Deleted',
            'location' => 'Temporary Area',
            'width' => 1920,
            'height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
            'secret_key' => 'sec_del123',
        ]);

        $response = $this->deleteJson("/admin/api/venue/{$venue->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('venues', [
            'id' => $venue->id,
        ]);
    }
}
