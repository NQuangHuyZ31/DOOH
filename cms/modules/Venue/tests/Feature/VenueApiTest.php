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
            'code' => 'SGN-LM81',
            'name' => 'Landmark 81',
            'venue_type' => 'shopping_mall',
            'city_province' => 'Ho Chi Minh City',
            'status' => 'active',
        ]);

        $response = $this->getJson('/admin/api/venue');

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.code', 'SGN-LM81')
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
            'code' => 'HAN-NOIBAI-T2',
            'name' => 'Noi Bai Terminal 2',
            'venue_type' => 'airport',
            'city_province' => 'Hanoi',
            'district' => 'Soc Son',
            'daily_traffic' => 60000,
            'status' => 'active',
        ];

        $response = $this->postJson('/admin/api/venue', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.code', 'HAN-NOIBAI-T2')
                 ->assertJsonPath('data.name', 'Noi Bai Terminal 2');

        $this->assertDatabaseHas('venues', [
            'code' => 'HAN-NOIBAI-T2',
            'name' => 'Noi Bai Terminal 2',
        ]);
    }

    public function test_create_venue_with_auto_generated_code(): void
    {
        $this->authenticateAsSuperAdmin();

        $payload = [
            'name' => 'Vincom Mega Mall',
            'city_province' => 'Ho Chi Minh City',
            'venue_type' => 'shopping_mall',
        ];

        $response = $this->postJson('/admin/api/venue', $payload);

        $response->assertStatus(201);
        $code = $response->json('data.code');
        $this->assertNotEmpty($code);
        $this->assertStringStartsWith('SGN-', $code);
    }

    public function test_show_venue_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-VCDK',
            'name' => 'Vincom Dong Khoi',
            'city_province' => 'Ho Chi Minh City',
            'status' => 'active',
        ]);

        $response = $this->getJson("/admin/api/venue/{$venue->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.code', 'SGN-VCDK');
    }

    public function test_update_venue_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'HAN-KEANGNAM',
            'name' => 'Keangnam 72',
            'city_province' => 'Hanoi',
            'status' => 'active',
        ]);

        $response = $this->putJson("/admin/api/venue/{$venue->id}", [
            'name' => 'Keangnam Landmark 72 Tower',
            'daily_traffic' => 45000,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('venues', [
            'id' => $venue->id,
            'name' => 'Keangnam Landmark 72 Tower',
            'daily_traffic' => 45000,
        ]);
    }

    public function test_delete_venue_soft_deletes(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-BITEXCO',
            'name' => 'Bitexco Financial Tower',
            'status' => 'active',
        ]);

        $response = $this->deleteJson("/admin/api/venue/{$venue->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('venues', ['id' => $venue->id]);
    }

    public function test_generate_code_endpoint(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/admin/api/venue/generate-code?city_province=Hanoi&name=Lotte+Center');

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.code', 'HAN-LOTTE-CENTER');
    }
}
