<?php

namespace Modules\Creative\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchCreateCreativeRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'items' => ['required', 'array', 'min:1', 'max:20'],
			'items.*.name' => ['required', 'string', 'max:255'],
			'items.*.type' => ['required', 'in:video,image,html5,vast'],
			'items.*.status' => ['nullable', 'in:draft,pending_review,approved,rejected'],
			'items.*.media_url' => ['required', 'string'],
			'items.*.thumbnail_url' => ['nullable', 'string'],
			'items.*.width' => ['required_unless:items.*.type,vast', 'nullable', 'integer', 'min:100', 'max:10000'],
			'items.*.height' => ['required_unless:items.*.type,vast', 'nullable', 'integer', 'min:100', 'max:10000'],
			'items.*.duration_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
			'items.*.file_size_bytes' => ['nullable', 'integer', 'min:0'],
			'items.*.mime_type' => ['nullable', 'string', 'max:100'],
		];
	}

	public function withValidator($validator): void
	{
		$validator->after(function ($validator) {
			$items = $this->input('items', []);
			if (!is_array($items)) return;

			foreach ($items as $idx => $item) {
				$type = (string) ($item['type'] ?? '');
				$mediaUrl = strtolower((string) ($item['media_url'] ?? ''));

				if ($type === 'image' && !preg_match('/\.(jpg|jpeg|png|webp)(\?.*)?$/i', $mediaUrl)) {
					$validator->errors()->add("items.{$idx}.media_url", "Item #{$idx}: Image creative must have a valid image URL (.jpg, .jpeg, .png, .webp).");
				}

				if ($type === 'video' && !preg_match('/\.(mp4|mov|avi)(\?.*)?$/i', $mediaUrl)) {
					$validator->errors()->add("items.{$idx}.media_url", "Item #{$idx}: Video creative must have a valid video URL (.mp4, .mov, .avi).");
				}

				if ($type === 'html5' && !preg_match('/\.(zip)(\?.*)?$/i', $mediaUrl) && !str_starts_with($mediaUrl, 'https://')) {
					$validator->errors()->add("items.{$idx}.media_url", "Item #{$idx}: HTML5 creative must be a .zip file or an HTTPS URL.");
				}
			}
		});
	}
}
