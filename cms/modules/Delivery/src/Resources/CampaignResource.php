<?php

namespace Modules\Delivery\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
	public function toArray(Request $request): array
	{
		return [
			'id' => $this->id,
			'code' => $this->code,
			'name' => $this->name,
			'description' => $this->description,
			'total_budget' => $this->total_budget ? (float) $this->total_budget : null,
			'start_date' => $this->start_date ? $this->start_date->toDateString() : null,
			'end_date' => $this->end_date ? $this->end_date->toDateString() : null,
			'status' => $this->status,
			'user' => $this->relationLoaded('user') && $this->user ? [
				'id' => $this->user->id,
				'name' => $this->user->name,
				'email' => $this->user->email,
			] : null,
			'line_items_count' => (int) ($this->line_items_count ?? ($this->relationLoaded('lineItems') ? $this->lineItems->count() : 0)),
			'created_at' => $this->created_at?->toISOString(),
			'updated_at' => $this->updated_at?->toISOString(),
		];
	}
}
