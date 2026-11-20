<?php

namespace Modules\Creative\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewCreativeRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'status' => ['required', 'in:approved,rejected,pending_review,draft'],
			'rejection_reason' => ['nullable', 'string', 'max:500'],
		];
	}
}
