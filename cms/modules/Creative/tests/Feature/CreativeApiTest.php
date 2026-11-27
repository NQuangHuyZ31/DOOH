<?php

namespace Modules\Creative\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Creative\Models\Creative;
use Tests\TestCase;

class CreativeApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		$this->artisan('migrate');
	}

	public function test_unauthenticated_request_is_rejected_with_401(): void
	{
		$response = $this->getJson('/admin/api/creative');
		$response->assertStatus(401)
			->assertJsonPath('status', 'error')
			->assertJsonPath('message', 'Unauthenticated.');
	}

	public function test_list_creatives_returns_paginated_json(): void
	{
		$this->authenticateAsSuperAdmin();

		Creative::create([
			'code' => 'CR-TEST-001',
			'name' => 'Sample Creative Promo',
			'type' => 'video',
			'status' => 'approved',
			'media_url' => 'https://example.com/video.mp4',
			'width' => 1920,
			'height' => 1080,
			'aspect_ratio' => '16:9',
			'duration_seconds' => 15,
		]);

		$response = $this->getJson('/admin/api/creative');

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonCount(1, 'data')
			->assertJsonPath('data.0.code', 'CR-TEST-001')
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

	public function test_create_creative_forces_pending_review_and_sets_creator(): void
	{
		$user = $this->authenticateAsSuperAdmin();

		$payload = [
			'name' => 'New Digital Banner',
			'type' => 'image',
			'media_url' => 'https://example.com/banner.jpg',
			'width' => 1080,
			'height' => 1920,
			'duration_seconds' => 10,
		];

		$response = $this->postJson('/admin/api/creative', $payload);

		$response->assertStatus(201)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.name', 'New Digital Banner')
			->assertJsonPath('data.aspect_ratio', '9:16')
			->assertJsonPath('data.status', 'pending_review')
			->assertJsonPath('data.creator.id', $user->id);

		$this->assertDatabaseHas('creatives', [
			'name' => 'New Digital Banner',
			'status' => 'pending_review',
			'user_id' => $user->id,
		]);
	}

	public function test_reviewer_can_create_creative_with_approved_status(): void
	{
		$user = $this->authenticateAsSuperAdmin();

		$payload = [
			'name' => 'Emergency Internal Notice',
			'type' => 'image',
			'status' => 'approved',
			'media_url' => 'https://example.com/notice.jpg',
			'width' => 1920,
			'height' => 1080,
			'duration_seconds' => 10,
		];

		$response = $this->postJson('/admin/api/creative', $payload);

		$response->assertStatus(201)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.status', 'approved')
			->assertJsonPath('data.approver.id', $user->id);

		$this->assertDatabaseHas('creatives', [
			'name' => 'Emergency Internal Notice',
			'status' => 'approved',
			'approved_by' => $user->id,
		]);
	}

	public function test_batch_create_creatives_success(): void
	{
		$user = $this->authenticateAsSuperAdmin();

		$payload = [
			'items' => [
				[
					'name' => 'Asset One',
					'type' => 'image',
					'media_url' => 'https://example.com/img1.jpg',
					'width' => 1920,
					'height' => 1080,
					'duration_seconds' => 10,
				],
				[
					'name' => 'Asset Two',
					'type' => 'video',
					'media_url' => 'https://example.com/vid2.mp4',
					'width' => 1080,
					'height' => 1920,
					'duration_seconds' => 15,
				],
			],
		];

		$response = $this->postJson('/admin/api/creative/batch', $payload);

		$response->assertStatus(201)
			->assertJsonPath('status', 'success')
			->assertJsonCount(2, 'data')
			->assertJsonPath('data.0.name', 'Asset One')
			->assertJsonPath('data.1.name', 'Asset Two');

		$this->assertDatabaseHas('creatives', ['name' => 'Asset One', 'user_id' => $user->id]);
		$this->assertDatabaseHas('creatives', ['name' => 'Asset Two', 'user_id' => $user->id]);
	}

	public function test_review_records_approver_and_timestamp(): void
	{
		$reviewer = $this->authenticateAsSuperAdmin();

		$creative = Creative::create([
			'code' => 'CR-STATUS-001',
			'name' => 'Review Test Creative',
			'type' => 'video',
			'status' => 'pending_review',
			'media_url' => 'https://example.com/video.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->patchJson("/admin/api/creative/{$creative->id}/status", [
			'status' => 'approved',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.status', 'approved')
			->assertJsonPath('data.approver.id', $reviewer->id)
			->assertJsonPath('data.approved_by', $reviewer->id);

		$this->assertDatabaseHas('creatives', [
			'id' => $creative->id,
			'status' => 'approved',
			'approved_by' => $reviewer->id,
		]);
	}

	public function test_create_image_creative_with_zip_url_is_rejected_with_422(): void
	{
		$this->authenticateAsSuperAdmin();

		$response = $this->postJson('/admin/api/creative', [
			'name' => 'Invalid Image with Zip',
			'type' => 'image',
			'media_url' => 'https://example.com/package.zip',
			'width' => 1920,
			'height' => 1080,
		]);

		$response->assertStatus(422)
			->assertJsonValidationErrors(['media_url']);
	}

	public function test_review_reject_records_reviewer_and_reason(): void
	{
		$reviewer = $this->authenticateAsSuperAdmin();

		$creative = Creative::create([
			'code' => 'CR-REJECT-001',
			'name' => 'Asset To Reject',
			'type' => 'video',
			'status' => 'pending_review',
			'media_url' => 'https://example.com/reject.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->patchJson("/admin/api/creative/{$creative->id}/status", [
			'status' => 'rejected',
			'rejection_reason' => 'Video resolution is too low.',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.status', 'rejected')
			->assertJsonPath('data.approver.id', $reviewer->id)
			->assertJsonPath('data.rejection_reason', 'Video resolution is too low.');

		$this->assertDatabaseHas('creatives', [
			'id' => $creative->id,
			'status' => 'rejected',
			'approved_by' => $reviewer->id,
			'rejection_reason' => 'Video resolution is too low.',
		]);
	}

	public function test_cannot_re_review_approved_creative(): void
	{
		$this->authenticateAsSuperAdmin();

		$creative = Creative::create([
			'code' => 'CR-LOCKED-001',
			'name' => 'Locked Asset',
			'type' => 'video',
			'status' => 'approved',
			'media_url' => 'https://example.com/locked.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->patchJson("/admin/api/creative/{$creative->id}/status", [
			'status' => 'rejected',
			'rejection_reason' => 'Trying to reject approved asset',
		]);

		$response->assertStatus(422)
			->assertJsonPath('status', 'error')
			->assertJsonPath('message', 'Approved creatives cannot have their status changed.');
	}

	public function test_update_approved_creative_preserves_approved_status(): void
	{
		$this->authenticateAsSuperAdmin();

		$creative = Creative::create([
			'code' => 'CR-EDIT-001',
			'name' => 'Initial Name',
			'type' => 'video',
			'status' => 'approved',
			'media_url' => 'https://example.com/vid.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->putJson("/admin/api/creative/{$creative->id}", [
			'name' => 'Updated Name for Asset',
			'status' => 'pending_review',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.name', 'Updated Name for Asset')
			->assertJsonPath('data.status', 'approved');

		$this->assertDatabaseHas('creatives', [
			'id' => $creative->id,
			'name' => 'Updated Name for Asset',
			'status' => 'approved',
		]);
	}

	public function test_batch_review_creatives(): void
	{
		$reviewer = $this->authenticateAsSuperAdmin();

		$c1 = Creative::create([
			'code' => 'CR-BATCH-001',
			'name' => 'Batch One',
			'type' => 'video',
			'status' => 'pending_review',
			'media_url' => 'https://example.com/1.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$c2 = Creative::create([
			'code' => 'CR-BATCH-002',
			'name' => 'Batch Two',
			'type' => 'video',
			'status' => 'pending_review',
			'media_url' => 'https://example.com/2.mp4',
			'width' => 1920,
			'height' => 1080,
		]);

		$response = $this->postJson('/admin/api/creative/batch-status', [
			'ids' => [$c1->id, $c2->id],
			'status' => 'approved',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.updated_count', 2);

		$this->assertDatabaseHas('creatives', ['id' => $c1->id, 'status' => 'approved', 'approved_by' => $reviewer->id]);
		$this->assertDatabaseHas('creatives', ['id' => $c2->id, 'status' => 'approved', 'approved_by' => $reviewer->id]);
	}

	public function test_reviewer_changing_media_url_preserves_approved_status_and_updates_approver(): void
	{
		$reviewer = $this->authenticateAsSuperAdmin();

		$creative = Creative::create([
			'code' => 'CR-REV-001',
			'name' => 'Initial Asset',
			'type' => 'video',
			'status' => 'approved',
			'media_url' => 'https://example.com/initial.mp4',
			'width' => 1920,
			'height' => 1080,
			'approved_by' => $reviewer->id,
			'approved_at' => now()->subDay(),
		]);

		$response = $this->putJson("/admin/api/creative/{$creative->id}", [
			'name' => 'Initial Asset',
			'media_url' => 'https://example.com/new_reviewer_media.mp4',
			'status' => 'approved',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.status', 'approved')
			->assertJsonPath('data.media_url', 'https://example.com/new_reviewer_media.mp4')
			->assertJsonPath('data.approver.id', $reviewer->id);

		$this->assertDatabaseHas('creatives', [
			'id' => $creative->id,
			'status' => 'approved',
			'media_url' => 'https://example.com/new_reviewer_media.mp4',
			'approved_by' => $reviewer->id,
		]);
	}

	public function test_non_reviewer_changing_media_url_resets_status_to_pending_review(): void
	{
		$perm = \Modules\User\Models\Permission::firstOrCreate(
			['name' => 'creative.edit'],
			['module' => 'creative', 'display_name' => 'Edit Creative']
		);
		$regularRole = \Modules\User\Models\Role::firstOrCreate(['name' => 'advertiser'], ['display_name' => 'Advertiser']);
		$regularRole->permissions()->syncWithoutDetaching([$perm->id]);

		$regularUser = \Modules\User\Models\User::create([
			'name' => 'Jane Regular',
			'email' => 'jane@regular.com',
			'password' => \Illuminate\Support\Facades\Hash::make('password123'),
			'role_id' => $regularRole->id,
			'permission_type' => \Modules\User\Models\User::PERMISSION_TYPE_ROLE,
		]);
		$this->actingAs($regularUser, 'web');

		$creative = Creative::create([
			'code' => 'CR-NORM-001',
			'name' => 'Approved Commercial',
			'type' => 'video',
			'status' => 'approved',
			'media_url' => 'https://example.com/original.mp4',
			'width' => 1920,
			'height' => 1080,
			'approved_by' => $regularUser->id,
			'approved_at' => now()->subDays(2),
		]);

		$response = $this->putJson("/admin/api/creative/{$creative->id}", [
			'name' => 'Approved Commercial',
			'media_url' => 'https://example.com/hacked_content.mp4',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.status', 'pending_review')
			->assertJsonPath('data.media_url', 'https://example.com/hacked_content.mp4');

		$this->assertDatabaseHas('creatives', [
			'id' => $creative->id,
			'status' => 'pending_review',
			'media_url' => 'https://example.com/hacked_content.mp4',
			'approved_by' => null,
			'approved_at' => null,
		]);
	}

	public function test_create_vast_creative_preserves_submitted_dimensions_and_duration_even_on_empty_reparse(): void
	{
		$this->authenticateAsSuperAdmin();
		\Illuminate\Support\Facades\Http::fake([
			'https://ads.example.com/vast*' => \Illuminate\Support\Facades\Http::response('<VAST version="3.0"></VAST>', 200),
		]);

		$response = $this->postJson('/admin/api/creative', [
			'name' => 'GAM VAST 720p',
			'type' => 'vast',
			'media_url' => 'https://ads.example.com/vast?correlator=[TIMESTAMP]',
			'width' => 1280,
			'height' => 720,
			'duration_seconds' => 10,
		]);

		$response->assertStatus(201)
			->assertJsonPath('data.width', 1280)
			->assertJsonPath('data.height', 720)
			->assertJsonPath('data.duration_seconds', 10)
			->assertJsonPath('data.aspect_ratio', '16:9');
	}
}
