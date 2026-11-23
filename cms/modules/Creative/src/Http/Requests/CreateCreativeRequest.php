<?php

namespace Modules\Creative\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCreativeRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'name' => ['required', 'string', 'max:255'],
			'code' => ['nullable', 'string', 'max:64', 'unique:creatives,code'],
			'type' => ['required', 'in:video,image,html5,vast'],
			'status' => ['nullable', 'in:draft,pending_review,approved,rejected'],
			'media_url' => ['required', 'string'],
			'thumbnail_url' => ['nullable', 'string'],
			'width' => ['required_unless:type,vast', 'nullable', 'integer', 'min:100', 'max:10000'],
			'height' => ['required_unless:type,vast', 'nullable', 'integer', 'min:100', 'max:10000'],
			'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
			'aspect_ratio' => ['nullable', 'string', 'max:32'],
			'file_size_bytes' => ['nullable', 'integer', 'min:0'],
			'mime_type' => ['nullable', 'string', 'max:100'],
			'metadata' => ['nullable', 'array'],
		];
	}

	public function withValidator($validator): void
	{
		$validator->after(function ($validator) {
			$type = (string) $this->input('type');
			$mediaUrl = strtolower((string) $this->input('media_url'));

			if ($type === 'image' && !preg_match('/\.(jpg|jpeg|png|webp)(\?.*)?$/i', $mediaUrl)) {
				$validator->errors()->add('media_url', 'Image creative must have a valid image URL (.jpg, .jpeg, .png, .webp).');
			}

			if ($type === 'video' && !preg_match('/\.(mp4|mov|avi)(\?.*)?$/i', $mediaUrl)) {
				$validator->errors()->add('media_url', 'Video creative must have a valid video URL (.mp4, .mov, .avi).');
			}

			if ($type === 'html5' && !preg_match('/\.(zip)(\?.*)?$/i', $mediaUrl) && !str_starts_with($mediaUrl, 'http')) {
				$validator->errors()->add('media_url', 'HTML5 creative must be a .zip file or a valid URL.');
			}
		});
	}
}
