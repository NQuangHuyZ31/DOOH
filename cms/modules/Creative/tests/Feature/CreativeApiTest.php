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
}
