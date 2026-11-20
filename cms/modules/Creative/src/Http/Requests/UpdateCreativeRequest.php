<?php

namespace Modules\Creative\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCreativeRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		$id = $this->route('id') ?? $this->id;

		return [
			'name' => ['sometimes', 'required', 'string', 'max:255'],
			'code' => ['sometimes', 'nullable', 'string', 'max:64', 'unique:creatives,code,' . $id],
			'type' => ['sometimes', 'required', 'in:video,image,html5,vast'],
			'status' => ['sometimes', 'in:draft,pending_review,approved,rejected'],
			'media_url' => ['sometimes', 'required', 'string'],
			'thumbnail_url' => ['nullable', 'string'],
			'width' => ['sometimes', 'required', 'integer', 'min:100', 'max:10000'],
			'height' => ['sometimes', 'required', 'integer', 'min:100', 'max:10000'],
			'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:300'],
			'aspect_ratio' => ['nullable', 'string', 'max:32'],
			'file_size_bytes' => ['nullable', 'integer', 'min:0'],
			'mime_type' => ['nullable', 'string', 'max:100'],
			'metadata' => ['nullable', 'array'],
		];
	}
}
