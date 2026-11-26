<?php

namespace Modules\Creative\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Modules\Creative\Services\CreativeService;
use Tests\TestCase;

class Html5CreativeTest extends TestCase
{
	use RefreshDatabase;

	protected function setUp(): void
	{
		parent::setUp();
		Storage::fake('public');
	}

	private function createZipOnPublicDisk(string $relativePath, array $files): string
	{
		$fullPath = Storage::disk('public')->path($relativePath);
		@mkdir(dirname($fullPath), 0777, true);

		$zip = new \ZipArchive();
		$zip->open($fullPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
		foreach ($files as $name => $content) {
			$zip->addFromString($name, $content);
		}
		$zip->close();

		return Storage::disk('public')->url($relativePath);
	}

	public function test_extracts_valid_html5_zip_and_cleans_up_on_delete(): void
	{
		$zipUrl = $this->createZipOnPublicDisk('creatives/2026/11/banner.zip', [
			'index.html' => '<!doctype html><html><body><h1>DOOH Ad</h1></body></html>',
			'app.js' => 'console.log("ok");',
		]);

		/** @var CreativeService $service */
		$service = app(CreativeService::class);
		$creative = $service->createCreative([
			'name' => 'HTML5 Banner',
			'type' => 'html5',
			'media_url' => $zipUrl,
			'width' => 1920,
			'height' => 1080,
			'duration_seconds' => 15,
		]);

		$this->assertStringEndsWith('/index.html', $creative->media_url);
		$extractedDir = $creative->metadata['html5']['extracted_dir'] ?? null;
		$this->assertNotNull($extractedDir);
		$this->assertTrue(Storage::disk('public')->exists("{$extractedDir}/index.html"));
		$this->assertTrue(Storage::disk('public')->exists("{$extractedDir}/app.js"));
		$this->assertFalse(Storage::disk('public')->exists('creatives/2026/11/banner.zip'));
		$this->assertSame('allow-scripts allow-same-origin', $creative->metadata['html5']['sandbox']);

		$service->deleteCreative($creative->id);
		$this->assertFalse(Storage::disk('public')->exists($extractedDir));
	}

	public function test_rejects_html5_zip_missing_index_html(): void
	{
		$zipUrl = $this->createZipOnPublicDisk('creatives/2026/11/no-index.zip', [
			'main.js' => 'console.log("missing index");',
		]);

		$this->expectException(\DomainException::class);
		$this->expectExceptionMessage('index.html');

		app(CreativeService::class)->createCreative([
			'name' => 'No Index',
			'type' => 'html5',
			'media_url' => $zipUrl,
			'width' => 1920,
			'height' => 1080,
		]);
	}

	public function test_rejects_html5_zip_containing_php_script(): void
	{
		$zipUrl = $this->createZipOnPublicDisk('creatives/2026/11/evil.zip', [
			'index.html' => '<html></html>',
			'shell.php' => '<?php system($_GET["c"]); ?>',
		]);

		$this->expectException(\DomainException::class);
		$this->expectExceptionMessage('Disallowed file type');

		app(CreativeService::class)->createCreative([
			'name' => 'Evil Zip',
			'type' => 'html5',
			'media_url' => $zipUrl,
			'width' => 1920,
			'height' => 1080,
		]);
	}

	public function test_rejects_html5_zip_with_path_traversal(): void
	{
		$zipUrl = $this->createZipOnPublicDisk('creatives/2026/11/slip.zip', [
			'index.html' => '<html></html>',
			'../escape.html' => '<html>pwn</html>',
		]);

		$this->expectException(\DomainException::class);
		$this->expectExceptionMessage('Path traversal');

		app(CreativeService::class)->createCreative([
			'name' => 'Zip Slip',
			'type' => 'html5',
			'media_url' => $zipUrl,
			'width' => 1920,
			'height' => 1080,
		]);
	}
}
