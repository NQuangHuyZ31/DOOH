<?php

namespace Modules\Delivery\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LineItemResource extends JsonResource
{
	public function toArray(Request $request): array
	{
		return [
			'id' => $this->id,
			'campaign_id' => $this->campaign_id,
			'creative_id' => $this->creative_id,
			'code' => $this->code,
			'name' => $this->name,
			'priority' => (int) $this->priority,
			'pacing_mode' => $this->pacing_mode,
			'orientation' => $this->orientation ?? 'landscape',
			'start_date' => $this->start_date ? $this->start_date->toDateString() : null,
			'end_date' => $this->end_date ? $this->end_date->toDateString() : null,
			'target_impressions' => (int) $this->target_impressions,
			'daily_impression_cap' => (int) $this->daily_impression_cap,
			'status' => $this->status,
			'campaign' => $this->relationLoaded('campaign') && $this->campaign ? [
				'id' => $this->campaign->id,
				'name' => $this->campaign->name,
				'code' => $this->campaign->code,
				'status' => $this->campaign->status,
			] : null,
			'creative' => $this->relationLoaded('creative') && $this->creative ? [
				'id' => $this->creative->id,
				'name' => $this->creative->name,
				'code' => $this->creative->code,
				'type' => $this->creative->type,
				'media_url' => $this->creative->media_url,
				'duration_seconds' => $this->creative->duration_seconds,
			] : null,
			'creatives' => $this->relationLoaded('creatives') && $this->creatives ? $this->creatives->map(fn ($c) => [
				'id' => $c->id,
				'name' => $c->name,
				'code' => $c->code,
				'type' => $c->type,
				'status' => $c->status,
				'media_url' => $c->media_url,
				'width' => $c->width,
				'height' => $c->height,
				'duration_seconds' => $c->duration_seconds,
				'weight' => (int) ($c->pivot?->weight ?? 1),
			])->all() : [],
			'venues' => $this->relationLoaded('venues') && $this->venues ? $this->venues->map(fn ($v) => [
				'id' => $v->id,
				'name' => $v->name,
				'code' => $v->code,
				'width' => $v->width,
				'height' => $v->height,
			])->all() : [],
			'screens' => $this->relationLoaded('screens') && $this->screens ? $this->screens->map(fn ($s) => [
				'id' => $s->id,
				'venue_id' => $s->venue_id,
				'name' => $s->name,
				'code' => $s->code,
				'orientation' => $s->orientation,
				'resolution_width' => $s->resolution_width,
				'resolution_height' => $s->resolution_height,
			])->all() : [],
			'created_at' => $this->created_at?->toISOString(),
			'updated_at' => $this->updated_at?->toISOString(),
		];
	}
}
