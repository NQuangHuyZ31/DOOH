<?php

namespace Modules\Delivery\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchStoreLineItemRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		return [
			'items' => ['required', 'array', 'min:1', 'max:50'],
			'items.*.campaign_id' => ['required', 'integer', 'exists:campaigns,id'],
			'items.*.name' => ['required', 'string', 'max:255'],
			'items.*.priority' => ['nullable', 'integer', 'between:1,10'],
			'items.*.pacing_mode' => ['nullable', 'in:evenly,asap'],
			'items.*.start_date' => ['required', 'date'],
			'items.*.end_date' => ['required', 'date', 'after_or_equal:items.*.start_date'],
			'items.*.target_impressions' => ['nullable', 'integer', 'min:1'],
			'items.*.daily_impression_cap' => ['nullable', 'integer', 'min:1'],
			'items.*.status' => ['nullable', 'in:draft,active,paused,completed'],
			'items.*.venue_ids' => ['nullable', 'array'],
			'items.*.venue_ids.*' => ['integer', 'exists:venues,id'],
			'items.*.creative_ids' => ['nullable', 'array'],
			'items.*.creative_ids.*' => ['integer', 'exists:creatives,id'],
			'items.*.creatives' => ['nullable', 'array'],
			'items.*.creatives.*.id' => ['required_with:items.*.creatives', 'integer', 'exists:creatives,id'],
			'items.*.creatives.*.weight' => ['nullable', 'integer', 'min:1', 'max:100'],
		];
	}
}
