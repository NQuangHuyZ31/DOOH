<?php

namespace Modules\Core\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		$folder = (string) $this->input('folder', 'general');
		$maxKb = $this->getMaxSizeByFolder($folder);
		$allowedMimes = $this->getAllowedMimesByFolder($folder);

		return [
			'file' => [
				'required',
				'file',
				"max:{$maxKb}",
				"mimes:{$allowedMimes}",
			],
			'folder' => ['nullable', 'string', 'max:64', 'regex:/^[a-zA-Z0-9_\-]+$/'],
		];
	}

	public function withValidator($validator): void
	{
		$validator->after(function ($validator) {
			$file = $this->file('file');
			if ($file) {
				$clientExt = strtolower($file->getClientOriginalExtension());
				$dangerous = ['php', 'phtml', 'phar', 'sh', 'exe', 'bat', 'cmd', 'cgi', 'pl', 'js', 'html', 'htm', 'svg'];
				if (in_array($clientExt, $dangerous, true)) {
					$validator->errors()->add('file', 'File extension is not permitted.');
				}
			}
		});
	}

	protected function getMaxSizeByFolder(string $folder): int
	{
		return match ($folder) {
			'avatars' => 2048,
			'images' => 10240,
			'creatives' => 102400,
			default => 20480,
		};
	}

	protected function getAllowedMimesByFolder(string $folder): string
	{
		return match ($folder) {
			'avatars', 'images' => 'jpg,jpeg,png,webp',
			'creatives' => 'mp4,mov,avi,jpg,jpeg,png,webp,zip,xml',
			default => 'mp4,mov,jpg,jpeg,png,webp,zip,pdf,xml',
		};
	}
}

