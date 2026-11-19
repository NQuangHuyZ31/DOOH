<?php

namespace Modules\Venue\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class ScreenApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_list_screens_returns_paginated_json(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-LM81',
            'name' => 'Landmark 81',
            'status' => 'active',
        ]);

        Screen::create([
            'venue_id' => $venue->id,
            'code' => 'SCR-SGN-LM81-01',
            'name' => 'LED Facade East',
            'resolution_width' => 1920,
            'resolution_height' => 1080,
            'orientation' => 'landscape',
            'status' => 'active',
        ]);

        $response = $this->getJson('/admin/api/venue/screen');

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.code', 'SCR-SGN-LM81-01');
    }

    public function test_create_screen_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'HAN-NOIBAI',
            'name' => 'Noi Bai Airport',
            'status' => 'active',
        ]);

        $payload = [
            'venue_id' => $venue->id,
            'name' => 'Gate 15 Totem Display',
            'screen_type' => 'indoor_led',
            'resolution_width' => 1080,
            'resolution_height' => 1920,
            'status' => 'active',
        ];

        $response = $this->postJson('/admin/api/venue/screen', $payload);

        $response->assertStatus(201)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.orientation', 'portrait')
                 ->assertJsonPath('data.aspect_ratio', '9:16');

        $this->assertDatabaseHas('screens', [
            'venue_id' => $venue->id,
            'name' => 'Gate 15 Totem Display',
            'orientation' => 'portrait',
        ]);

        // Code was auto-generated
        $code = $response->json('data.code');
        $this->assertNotEmpty($code);
        $this->assertStringStartsWith('SCR-HAN-NOIBAI', $code);

        // Secret key was auto-generated
        $secretKey = $response->json('data.secret_key');
        $this->assertNotEmpty($secretKey);
    }

    public function test_show_screen_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-VCDK',
            'name' => 'Vincom Dong Khoi',
            'status' => 'active',
        ]);

        $screen = Screen::create([
            'venue_id' => $venue->id,
            'code' => 'SCR-SGN-VCDK-01',
            'name' => 'Main Door Hanging LED',
            'resolution_width' => 1920,
            'resolution_height' => 1080,
            'status' => 'active',
        ]);

        $response = $this->getJson("/admin/api/venue/screen/{$screen->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success')
                 ->assertJsonPath('data.code', 'SCR-SGN-VCDK-01');
    }

    public function test_update_screen_success(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'HAN-LOTTE',
            'name' => 'Lotte Center',
            'status' => 'active',
        ]);

        $screen = Screen::create([
            'venue_id' => $venue->id,
            'code' => 'SCR-HAN-LT-01',
            'name' => 'Observation Deck LCD',
            'resolution_width' => 1920,
            'resolution_height' => 1080,
            'status' => 'active',
        ]);

        $response = $this->putJson("/admin/api/venue/screen/{$screen->id}", [
            'name' => 'Sky Deck Premium 4K LED',
            'resolution_width' => 3840,
            'resolution_height' => 2160,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('screens', [
            'id' => $screen->id,
            'name' => 'Sky Deck Premium 4K LED',
            'resolution_width' => 3840,
            'resolution_height' => 2160,
        ]);
    }

    public function test_delete_screen_soft_deletes(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-TEST',
            'name' => 'Test Venue',
            'status' => 'active',
        ]);

        $screen = Screen::create([
            'venue_id' => $venue->id,
            'code' => 'SCR-DEL-01',
            'name' => 'Screen to Delete',
            'resolution_width' => 1920,
            'resolution_height' => 1080,
            'status' => 'active',
        ]);

        $response = $this->deleteJson("/admin/api/venue/screen/{$screen->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('screens', ['id' => $screen->id]);
    }

    public function test_regenerate_secret_key(): void
    {
        $this->authenticateAsSuperAdmin();

        $venue = Venue::create([
            'code' => 'SGN-SEC',
            'name' => 'Security Test Venue',
            'status' => 'active',
        ]);

        $screen = Screen::create([
            'venue_id' => $venue->id,
            'code' => 'SCR-SEC-01',
            'name' => 'Security Screen',
            'secret_key' => 'old_secret_key_123',
            'status' => 'active',
        ]);

        $response = $this->postJson("/admin/api/venue/screen/{$screen->id}/regenerate-key");

        $response->assertStatus(200)
                 ->assertJsonPath('status', 'success');

        $newKey = $response->json('data.secret_key');
        $this->assertNotEmpty($newKey);
        $this->assertNotEquals('old_secret_key_123', $newKey);
    }
}
