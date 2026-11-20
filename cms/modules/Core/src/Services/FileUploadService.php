<?php

namespace Modules\Core\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
	public function upload(
		UploadedFile $file,
		string $folder = 'general',
		string $disk = 'public'
	): array {
		$sanitizedFolder = preg_replace('/[^a-zA-Z0-9_\-]/', '', $folder) ?: 'general';
		$dateFolder = now()->format('Y/m');
		$clientExt = strtolower($file->getClientOriginalExtension());
		$detectedExt = strtolower($file->extension() ?: $clientExt) ?: 'bin';

		// Block dangerous script extensions
		if (in_array($clientExt, ['php', 'phtml', 'phar', 'sh', 'exe', 'bat', 'cmd', 'cgi', 'pl', 'js', 'html', 'htm', 'svg'], true)) {
			throw new \InvalidArgumentException('Uploaded file extension is not permitted.');
		}

		$filename = (string) Str::uuid() . '.' . $detectedExt;
		$targetPath = "{$sanitizedFolder}/{$dateFolder}";

		$path = $file->storeAs($targetPath, $filename, $disk);

		return [
			'url' => Storage::disk($disk)->url($path),
			'path' => $path,
			'original_name' => $file->getClientOriginalName(),
			'file_size' => $file->getSize(),
			'mime_type' => $file->getClientMimeType() ?: $file->getMimeType(),
			'extension' => $detectedExt,
		];
	}

	public function delete(string $path, string $disk = 'public'): bool
	{
		if (Storage::disk($disk)->exists($path)) {
			return Storage::disk($disk)->delete($path);
		}

		return false;
	}
}
