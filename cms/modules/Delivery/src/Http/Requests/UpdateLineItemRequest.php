<?php

namespace Modules\Delivery\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLineItemRequest extends FormRequest
{
	public function authorize(): bool
	{
		return true;
	}

	public function rules(): array
	{
		$id = $this->route('id') ?? $this->input('id');

		return [
			'campaign_id' => ['sometimes', 'required', 'integer', 'exists:campaigns,id'],
			'creative_id' => ['nullable', 'integer', 'exists:creatives,id'],
			'creative_ids' => ['nullable', 'array'],
			'creative_ids.*' => ['integer', 'exists:creatives,id'],
			'creatives' => ['nullable', 'array'],
			'creatives.*.id' => ['required_with:creatives', 'integer', 'exists:creatives,id'],
			'creatives.*.weight' => ['nullable', 'integer', 'min:1', 'max:100'],
			'code' => ['nullable', 'string', 'max:64', Rule::unique('line_items', 'code')->ignore($id)->whereNull('deleted_at')],
			'name' => ['sometimes', 'required', 'string', 'max:255'],
			'priority' => ['nullable', 'integer', 'between:1,10'],
			'pacing_mode' => ['nullable', 'in:evenly,asap'],
			'orientation' => ['nullable', 'in:landscape,portrait,custom'],
			'start_date' => ['sometimes', 'required', 'date'],
			'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
			'target_impressions' => ['nullable', 'integer', 'min:1'],
			'daily_impression_cap' => ['nullable', 'integer', 'min:1'],
			'status' => ['nullable', 'in:draft,active,paused,completed'],
			'venue_ids' => ['nullable', 'array'],
			'venue_ids.*' => ['integer', 'exists:venues,id'],
			'screen_ids' => ['nullable', 'array'],
			'screen_ids.*' => ['integer', 'exists:screens,id'],
		];
	}

	public function withValidator($validator): void
	{
		$validator->after(function ($v) {
			$id = $this->route('id') ?? $this->input('id');
			/** @var \Modules\Delivery\Models\LineItem|null $existing */
			$existing = $id ? \Modules\Delivery\Models\LineItem::find($id) : null;
			$orientation = $this->input('orientation', $existing?->orientation ?? 'landscape');
			if ($orientation === 'custom') return;

			$screenIds = $this->has('screen_ids') ? $this->input('screen_ids', []) : ($existing ? $existing->screens->pluck('id')->all() : []);
			if (!empty($screenIds)) {
				$screens = \Modules\Venue\Models\Screen::whereIn('id', $screenIds)->get();
				foreach ($screens as $s) {
					if ($s->orientation !== $orientation && $s->orientation !== 'custom') {
						$v->errors()->add('screen_ids', "Screen '{$s->name}' ({$s->orientation}) is incompatible with line item orientation ({$orientation}).");
					}
				}
			}

			if ($this->has('creatives') || $this->has('creative_ids') || $this->has('creative_id')) {
				$creativesData = $this->input('creatives', []);
				$creativeIds = $this->input('creative_ids', []);
				$allCrIds = array_filter(array_unique(array_merge(
					$creativeIds,
					array_column($creativesData, 'id'),
					$this->input('creative_id') ? [$this->input('creative_id')] : []
				)));
			} else {
				$allCrIds = $existing ? $existing->creatives->pluck('id')->all() : [];
			}

			if (!empty($allCrIds)) {
				$creatives = \Modules\Creative\Models\Creative::whereIn('id', $allCrIds)->get();
				foreach ($creatives as $cr) {
					$crOrientation = ($cr->width ?: 1920) >= ($cr->height ?: 1080) ? 'landscape' : 'portrait';
					if ($crOrientation !== $orientation) {
						$v->errors()->add('creatives', "Creative '{$cr->name}' ({$crOrientation}) is incompatible with line item orientation ({$orientation}).");
					}
				}
			}
		});
	}
}
