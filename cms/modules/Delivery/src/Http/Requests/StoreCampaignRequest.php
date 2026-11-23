<?php

namespace Modules\Delivery\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCampaignRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'code' => ['nullable', 'string', 'max:64', Rule::unique('campaigns', 'code')->whereNull('deleted_at')],
			'name' => ['required', 'string', 'max:255'],
			'description' => ['nullable', 'string', 'max:1000'],
			'total_budget' => ['nullable', 'numeric', 'min:0'],
			'start_date' => ['required', 'date'],
			'end_date' => ['required', 'date', 'after_or_equal:start_date'],
			'status' => ['nullable', 'in:draft,active,paused,completed,archived'],
		];
	}
}
