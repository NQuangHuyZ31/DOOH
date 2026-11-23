<?php

namespace Modules\Delivery\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCampaignRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		$id = $this->route('id') ?? $this->input('id');

		return [
			'code' => ['nullable', 'string', 'max:64', Rule::unique('campaigns', 'code')->ignore($id)->whereNull('deleted_at')],
			'name' => ['sometimes', 'required', 'string', 'max:255'],
			'description' => ['nullable', 'string', 'max:1000'],
			'total_budget' => ['nullable', 'numeric', 'min:0'],
			'start_date' => ['sometimes', 'required', 'date'],
			'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
			'status' => ['nullable', 'in:draft,active,paused,completed,archived'],
		];
	}
}
