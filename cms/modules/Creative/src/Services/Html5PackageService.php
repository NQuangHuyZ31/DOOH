<?php

namespace Modules\Creative\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Html5PackageService
{
	private const MAX_FILES = 200;
	private const MAX_UNCOMPRESSED_BYTES = 31457280; // 30MB
	private const SANDBOX_ATTR = 'allow-scripts allow-same-origin';
	private const ALLOWED_EXTENSIONS = [
		'html', 'htm', 'css', 'js', 'mjs', 'json',
		'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg',
		'woff', 'woff2', 'ttf', 'otf',
		'mp4', 'webm', 'mp3', 'ogg', 'txt', 'xml',
	];

	public function preparePackage(string $mediaUrl, string $disk = 'public'): array
	{
		if (!$this->isZipUrl($mediaUrl)) {
			if (!str_starts_with(strtolower($mediaUrl), 'https://') && !str_starts_with($mediaUrl, '/storage/')) {
				throw new \DomainException('HTML5 creative URL must use HTTPS or be an uploaded .zip package.');
			}

			return ['entry_url' => $mediaUrl, 'sandbox' => self::SANDBOX_ATTR];
		}

		$relativeZipPath = $this->resolveStorageRelativePath($mediaUrl);
		if (!$relativeZipPath || !Storage::disk($disk)->exists($relativeZipPath)) {
			// External remote .zip URL not stored locally
			return ['entry_url' => $mediaUrl, 'sandbox' => self::SANDBOX_ATTR];
		}

		if (!class_exists(\ZipArchive::class)) {
			throw new \DomainException('PHP ZipArchive extension is required to extract HTML5 packages.');
		}

		$fullZipPath = Storage::disk($disk)->path($relativeZipPath);
		$zip = new \ZipArchive();
		if ($zip->open($fullZipPath) !== true) {
			throw new \DomainException('Unable to open HTML5 .zip package.');
		}

		$entries = [];
		$totalBytes = 0;

		try {
			if ($zip->numFiles === 0 || $zip->numFiles > self::MAX_FILES) {
				throw new \DomainException('HTML5 .zip package must contain between 1 and ' . self::MAX_FILES . ' files.');
			}

			for ($i = 0; $i < $zip->numFiles; $i++) {
				$stat = $zip->statIndex($i);
				$name = $stat['name'] ?? '';
				if ($name === '' || str_ends_with($name, '/') || str_starts_with($name, '__MACOSX/')) {
					continue;
				}

				$this->assertSafeEntryPath($name);
				$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
				if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
					throw new \DomainException("Disallowed file type in HTML5 package: {$name}");
				}

				$totalBytes += (int) ($stat['size'] ?? 0);
				if ($totalBytes > self::MAX_UNCOMPRESSED_BYTES) {
					throw new \DomainException('HTML5 package exceeds maximum uncompressed size of 30MB.');
				}

				$entries[] = ['index' => $i, 'name' => $name];
			}

			$stripPrefix = $this->detectRootPrefix($entries);
			$hasIndex = false;
			foreach ($entries as $entry) {
				$normalized = $stripPrefix !== '' ? substr($entry['name'], strlen($stripPrefix)) : $entry['name'];
				if (strtolower($normalized) === 'index.html') {
					$hasIndex = true;
					break;
				}
			}

			if (!$hasIndex) {
				throw new \DomainException('HTML5 .zip package must contain an index.html file at the root.');
			}

			$extractDir = 'creatives/html5/' . Str::uuid();
			foreach ($entries as $entry) {
				$relative = $stripPrefix !== '' ? substr($entry['name'], strlen($stripPrefix)) : $entry['name'];
				$stream = $zip->getStream($entry['name']);
				if ($stream === false) {
					throw new \DomainException("Failed to read file from HTML5 package: {$entry['name']}");
				}
				Storage::disk($disk)->put("{$extractDir}/{$relative}", $stream);
				fclose($stream);
			}
		} finally {
			$zip->close();
		}

		// Clean up original uploaded .zip archive after safe extraction
		Storage::disk($disk)->delete($relativeZipPath);

		return [
			'entry_url' => Storage::disk($disk)->url("{$extractDir}/index.html"),
			'extracted_dir' => $extractDir,
			'files_count' => count($entries),
			'sandbox' => self::SANDBOX_ATTR,
		];
	}

	public function deletePackage(?string $extractedDir, string $disk = 'public'): void
	{
		if (!$extractedDir || !str_starts_with($extractedDir, 'creatives/html5/')) {
			return;
		}

		if (Storage::disk($disk)->exists($extractedDir)) {
			Storage::disk($disk)->deleteDirectory($extractedDir);
		}
	}

	protected function isZipUrl(string $url): bool
	{
		return (bool) preg_match('/\.zip(\?.*)?$/i', $url);
	}

	protected function resolveStorageRelativePath(string $mediaUrl): ?string
	{
		$path = parse_url($mediaUrl, PHP_URL_PATH) ?: $mediaUrl;
		$pos = strpos($path, '/storage/');
		if ($pos === false) {
			return null;
		}

		return ltrim(substr($path, $pos + strlen('/storage/')), '/');
	}

	protected function assertSafeEntryPath(string $name): void
	{
		if (str_contains($name, "\0") || str_contains($name, '\\') || str_starts_with($name, '/')) {
			throw new \DomainException("Unsafe file path in HTML5 package: {$name}");
		}

		foreach (explode('/', $name) as $segment) {
			if ($segment === '..' || $segment === '.') {
				throw new \DomainException("Path traversal detected in HTML5 package: {$name}");
			}
		}
	}

	protected function detectRootPrefix(array $entries): string
	{
		if (empty($entries)) {
			return '';
		}

		$firstSegments = array_unique(array_map(fn ($e) => explode('/', $e['name'])[0], $entries));
		if (count($firstSegments) === 1 && str_contains($entries[0]['name'], '/')) {
			return $firstSegments[0] . '/';
		}

		return '';
	}
}
