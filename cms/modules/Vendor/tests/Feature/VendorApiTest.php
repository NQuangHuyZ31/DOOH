<?php

namespace Modules\Vendor\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Vendor\Models\Vendor;
use Tests\TestCase;

class VendorApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		$this->artisan('migrate');
	}

	public function test_unauthenticated_request_is_rejected_with_401(): void
	{
		$response = $this->getJson('/admin/api/vendor');
		$response->assertStatus(401)
				 ->assertJsonPath('status', 'error')
				 ->assertJsonPath('message', 'Unauthenticated.');
	}

	public function test_list_vendors_returns_paginated_json(): void
	{
		$this->authenticateAsSuperAdmin();

		Vendor::create([
			'code' => 'VND-TEST1',
			'name' => 'Test Vendor One',
			'company_name' => 'Test JSC',
			'status' => 'active',
		]);

		$response = $this->getJson('/admin/api/vendor');

		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonCount(1, 'data')
				 ->assertJsonPath('data.0.code', 'VND-TEST1')
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

	public function test_create_vendor_success_and_returns_plain_api_key(): void
	{
		$this->authenticateAsSuperAdmin();

		$payload = [
			'name' => 'Keangnam Media Partner',
			'company_name' => 'Keangnam DOOH JSC',
			'tax_code' => '0109988776',
			'contact_name' => 'Mr. Keangnam',
			'contact_email' => 'partner@keangnam.vn',
			'contact_phone' => '0988112233',
			'address' => 'Pham Hung, Hanoi',
			'revenue_share_percentage' => 75.50,
			'rate_limit_per_minute' => 180,
		];

		$response = $this->postJson('/admin/api/vendor', $payload);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.vendor.name', 'Keangnam Media Partner')
				 ->assertJsonPath('data.vendor.revenue_share_percentage', 75.5)
				 ->assertJsonPath('data.vendor.has_api_key', true);

		$plainKey = $response->json('data.plain_api_key');
		$this->assertNotEmpty($plainKey);
		$this->assertStringStartsWith('dooh_live_', $plainKey);

		// Assert saved hashed key in DB
		$createdVendor = Vendor::where('name', 'Keangnam Media Partner')->first();
		$this->assertNotNull($createdVendor);
		$this->assertSame(hash('sha256', $plainKey), $createdVendor->api_key_hash);
	}

	public function test_create_vendor_validation_failure(): void
	{
		$this->authenticateAsSuperAdmin();

		$response = $this->postJson('/admin/api/vendor', [
			'company_name' => 'Missing Name JSC',
		]);

		$response->assertStatus(422)
				 ->assertJsonValidationErrors(['name']);
	}

	public function test_get_vendor_by_id(): void
	{
		$this->authenticateAsSuperAdmin();

		$vendor = Vendor::create([
			'code' => 'VND-GET1',
			'name' => 'Get Vendor Test',
			'status' => 'active',
		]);

		$response = $this->getJson("/admin/api/vendor/vendor/{$vendor->id}");

		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.code', 'VND-GET1');
	}

	public function test_update_vendor_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$vendor = Vendor::create([
			'code' => 'VND-UP1',
			'name' => 'Old Name',
			'status' => 'active',
		]);

		$response = $this->putJson("/admin/api/vendor/vendor/{$vendor->id}", [
			'name' => 'New Updated Name',
			'revenue_share_percentage' => 80.00,
		]);

		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.name', 'New Updated Name')
				 ->assertJsonPath('data.revenue_share_percentage', 80);
	}

	public function test_delete_vendor_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$vendor = Vendor::create([
			'code' => 'VND-DEL1',
			'name' => 'To Be Deleted',
			'status' => 'active',
		]);

		$response = $this->deleteJson("/admin/api/vendor/vendor/{$vendor->id}");

		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success');

		$this->assertSoftDeleted('vendors', ['id' => $vendor->id]);
	}

	public function test_regenerate_api_key_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$vendor = Vendor::create([
			'code' => 'VND-REGEN',
			'name' => 'Regen Test',
			'api_key_hash' => hash('sha256', 'dooh_live_old_key'),
			'api_key_prefix' => 'dooh_live_old_',
		]);

		$response = $this->postJson("/admin/api/vendor/vendor/{$vendor->id}/regenerate-api-key");

		$response->assertStatus(200)
				 ->assertJsonPath('status', 'success');

		$newPlainKey = $response->json('data.plain_api_key');
		$this->assertNotEmpty($newPlainKey);
		$this->assertNotEquals('dooh_live_old_key', $newPlainKey);

		$freshVendor = $vendor->fresh();
		$this->assertSame(hash('sha256', $newPlainKey), $freshVendor->api_key_hash);
	}

	public function test_create_vendor_with_user_account_success(): void
	{
		$this->authenticateAsSuperAdmin();

		\Modules\User\Models\Role::firstOrCreate(['name' => 'media_owner'], ['display_name' => 'Media Owner']);

		$payload = [
			'name' => 'Auto User Vendor',
			'contact_name' => 'John Vendor',
			'contact_email' => 'john.vendor@example.com',
			'create_user' => true,
			'user_name' => 'John Vendor Login',
			'user_email' => 'john.vendor.login@example.com',
			'user_password' => 'secret123456',
		];

		$response = $this->postJson('/admin/api/vendor', $payload);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.vendor.name', 'Auto User Vendor');

		$vendor = Vendor::where('name', 'Auto User Vendor')->first();
		$this->assertNotNull($vendor);
		$this->assertNotNull($vendor->user_id);

		$user = \Modules\User\Models\User::find($vendor->user_id);
		$this->assertNotNull($user);
		$this->assertSame('john.vendor.login@example.com', $user->email);
		$this->assertSame('John Vendor Login', $user->name);
		$this->assertSame('media_owner', $user->role?->name);
	}

	public function test_create_vendor_with_existing_user_id_success(): void
	{
		$this->authenticateAsSuperAdmin();

		$role = \Modules\User\Models\Role::firstOrCreate(['name' => 'media_owner'], ['display_name' => 'Media Owner']);
		$existingUser = \Modules\User\Models\User::create([
			'name' => 'Existing Media Owner',
			'email' => 'existing.owner@example.com',
			'password' => 'secret123',
			'role_id' => $role->id,
			'permission_type' => 'role',
		]);

		$response = $this->postJson('/admin/api/vendor', [
			'name' => 'Existing User Vendor',
			'user_id' => $existingUser->id,
		]);

		$response->assertStatus(201)
				 ->assertJsonPath('status', 'success')
				 ->assertJsonPath('data.vendor.user_id', $existingUser->id);

		$vendor = Vendor::where('name', 'Existing User Vendor')->first();
		$this->assertNotNull($vendor);
		$this->assertSame($existingUser->id, $vendor->user_id);
	}

	public function test_create_vendor_with_already_linked_user_fails(): void
	{
		$this->authenticateAsSuperAdmin();

		$role = \Modules\User\Models\Role::firstOrCreate(['name' => 'media_owner'], ['display_name' => 'Media Owner']);
		$user = \Modules\User\Models\User::create([
			'name' => 'Single Media Owner',
			'email' => 'single.owner@example.com',
			'password' => 'secret123',
			'role_id' => $role->id,
			'permission_type' => 'role',
		]);

		Vendor::create([
			'code' => 'VND-FIRST',
			'name' => 'First Vendor',
			'status' => 'active',
			'user_id' => $user->id,
		]);

		// Attempt to link the same user to second vendor
		$response = $this->postJson('/admin/api/vendor', [
			'name' => 'Second Vendor Conflict',
			'user_id' => $user->id,
		]);

		$response->assertStatus(422)
				 ->assertJsonValidationErrors(['user_id']);
	}

	public function test_update_vendor_cannot_alter_user_id(): void
	{
		$this->authenticateAsSuperAdmin();

		$role = \Modules\User\Models\Role::firstOrCreate(['name' => 'media_owner'], ['display_name' => 'Media Owner']);
		$user1 = \Modules\User\Models\User::create([
			'name' => 'Original Owner',
			'email' => 'orig.owner@example.com',
			'password' => 'secret123',
			'role_id' => $role->id,
			'permission_type' => 'role',
		]);
		$user2 = \Modules\User\Models\User::create([
			'name' => 'Target Owner',
			'email' => 'target.owner@example.com',
			'password' => 'secret123',
			'role_id' => $role->id,
			'permission_type' => 'role',
		]);

		$vendor = Vendor::create([
			'code' => 'VND-NO-ALTER',
			'name' => 'Immutable User Vendor',
			'status' => 'active',
			'user_id' => $user1->id,
		]);

		// Attempt to alter user_id on update
		$response = $this->putJson("/admin/api/vendor/vendor/{$vendor->id}", [
			'name' => 'Renamed Vendor',
			'user_id' => $user2->id,
		]);

		$response->assertStatus(200);
		// user_id must remain unchanged
		$this->assertSame($user1->id, $vendor->fresh()->user_id);
	}

	public function test_delete_vendor_unlinks_user_and_allows_relinking(): void
	{
		$this->authenticateAsSuperAdmin();

		$role = \Modules\User\Models\Role::firstOrCreate(['name' => 'media_owner'], ['display_name' => 'Media Owner']);
		$user = \Modules\User\Models\User::create([
			'name' => 'Reusable Media Owner',
			'email' => 'reusable.owner@example.com',
			'password' => 'secret123',
			'role_id' => $role->id,
			'permission_type' => 'role',
		]);

		$resA = $this->postJson('/admin/api/vendor', [
			'name' => 'Vendor First Owner',
			'user_id' => $user->id,
		]);
		$resA->assertStatus(201);
		$vendorAId = $resA->json('data.vendor.id');

		$this->assertSame($vendorAId, $user->fresh()->vendor?->id);

		// Delete Vendor A
		$delRes = $this->deleteJson("/admin/api/vendor/vendor/{$vendorAId}");
		$delRes->assertStatus(200);

		// User must now be unlinked
		$this->assertNull($user->fresh()->vendor);

		// Linking the same user to Vendor B must succeed
		$resB = $this->postJson('/admin/api/vendor', [
			'name' => 'Vendor Second Owner',
			'user_id' => $user->id,
		]);
		$resB->assertStatus(201)
			 ->assertJsonPath('status', 'success')
			 ->assertJsonPath('data.vendor.user_id', $user->id);

		$vendorBId = $resB->json('data.vendor.id');
		$this->assertSame($vendorBId, $user->fresh()->vendor?->id);
	}
}
