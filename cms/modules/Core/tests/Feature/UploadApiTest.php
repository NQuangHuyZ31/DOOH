<?php

namespace Modules\Core\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadApiTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		$this->artisan('migrate');
	}

	public function test_unauthenticated_upload_is_rejected_with_401(): void
	{
		$file = UploadedFile::fake()->create('test.jpg', 500, 'image/jpeg');
		$response = $this->postJson('/admin/api/core/upload', ['file' => $file]);

		$response->assertStatus(401);
	}

	public function test_upload_file_success_stores_in_folder(): void
	{
		$this->authenticateAsSuperAdmin();
		Storage::fake('public');

		$file = UploadedFile::fake()->create('banner.png', 1000, 'image/png');
		$response = $this->postJson('/admin/api/core/upload', [
			'file' => $file,
			'folder' => 'creatives',
		]);

		$response->assertStatus(200)
			->assertJsonPath('status', 'success')
			->assertJsonPath('data.original_name', 'banner.png')
			->assertJsonPath('data.extension', 'png');

		$this->assertNotEmpty($response->json('data.url'));
		$this->assertStringStartsWith('creatives/', $response->json('data.path'));
	}

	public function test_dangerous_files_are_rejected_with_422(): void
	{
		$this->authenticateAsSuperAdmin();
		Storage::fake('public');

		$phpFile = UploadedFile::fake()->create('shell.php', 10, 'application/x-php');
		$resPhp = $this->postJson('/admin/api/core/upload', ['file' => $phpFile]);
		$resPhp->assertStatus(422);

		$exeFile = UploadedFile::fake()->create('trojan.exe', 100, 'application/x-msdownload');
		$resExe = $this->postJson('/admin/api/core/upload', ['file' => $exeFile]);
		$resExe->assertStatus(422);
	}

	public function test_avatar_folder_rejects_zip_files(): void
	{
		$this->authenticateAsSuperAdmin();
		Storage::fake('public');

		$zipFile = UploadedFile::fake()->create('archive.zip', 500, 'application/zip');
		$response = $this->postJson('/admin/api/core/upload', [
			'file' => $zipFile,
			'folder' => 'avatars',
		]);

		$response->assertStatus(422);
	}
}
