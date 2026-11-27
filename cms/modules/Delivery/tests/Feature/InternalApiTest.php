<?php

namespace Modules\Delivery\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Vendor\Models\Vendor;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;
use Tests\TestCase;

class InternalApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		config()->set('modules.internal_secret', 'test-internal-secret-value');
	}

	public function test_internal_endpoints_reject_missing_or_invalid_secret(): void
	{
		$this->getJson('/admin/api/internal/auth/screen?code=SCR-01')->assertStatus(401);
		$this->getJson('/admin/api/internal/auth/vendor?key_hash=abc', ['X-INTERNAL-SECRET' => 'wrong'])->assertStatus(401);
		$this->getJson('/admin/api/internal/delivery/playlist?venue_id=1')->assertStatus(401);
	}

	public function test_internal_screen_auth_endpoint_returns_screen_metadata(): void
	{
		$venue = Venue::create([
			'code' => 'VNU-INT-01',
			'name' => 'Internal Test Venue',
			'city' => 'Hanoi',
			'status' => 'active',
		]);

		$secretKey = HmacKeyUtil::generateScopedKey('screen', 'SCR-INT-01');
		$screen = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-INT-01',
			'name' => 'Main LED',
			'screen_type' => 'outdoor_led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => $secretKey,
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/internal/auth/screen?code=SCR-INT-01', ['X-INTERNAL-SECRET' => 'test-internal-secret-value']);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.screen_id', $screen->id)
			->assertJsonPath('data.venue_id', $venue->id)
			->assertJsonPath('data.code', 'SCR-INT-01')
			->assertJsonPath('data.secret_key', $secretKey)
			->assertJsonPath('data.status', 'active');
	}

	public function test_internal_vendor_auth_endpoint_returns_vendor_metadata(): void
	{
		$keyData = HmacKeyUtil::generatePrefixedKey('dooh_live_');
		$vendor = Vendor::create([
			'code' => 'VND-INT-01',
			'name' => 'Internal Partner',
			'contact_name' => 'Alice',
			'contact_email' => 'alice@partner.test',
			'api_key_hash' => $keyData['hash'],
			'api_key_prefix' => $keyData['prefix'],
			'rate_limit_per_minute' => 180,
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/internal/auth/vendor?key_hash=' . $keyData['hash'], ['X-INTERNAL-SECRET' => 'test-internal-secret-value']);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.vendor_id', $vendor->id)
			->assertJsonPath('data.name', 'Internal Partner')
			->assertJsonPath('data.rate_limit_per_min', 180)
			->assertJsonPath('data.status', 'active');
	}

	public function test_internal_playlist_endpoint_returns_screen_playlist_envelope(): void
	{
		$venue = Venue::create([
			'code' => 'VNU-PL-01',
			'name' => 'Playlist Venue',
			'city' => 'HCMC',
			'status' => 'active',
		]);

		$screen = Screen::create([
			'venue_id' => $venue->id,
			'code' => 'SCR-PL-01',
			'name' => 'Screen PL',
			'screen_type' => 'outdoor_led',
			'resolution_width' => 1920,
			'resolution_height' => 1080,
			'orientation' => 'landscape',
			'secret_key' => HmacKeyUtil::generateScopedKey('screen', 'SCR-PL-01'),
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/internal/delivery/playlist?screen_id=' . $screen->id, ['X-INTERNAL-SECRET' => 'test-internal-secret-value']);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.screen_id', $screen->id)
			->assertJsonPath('data.venue_id', $venue->id)
			->assertJsonPath('data.playlist', []);
	}
}
