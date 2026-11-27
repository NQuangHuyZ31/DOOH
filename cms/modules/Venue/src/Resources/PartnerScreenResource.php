<?php

namespace Modules\Venue\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerScreenResource extends JsonResource
{
	public function __construct(mixed $resource, protected bool $includeSecret = false)
	{
		parent::__construct($resource);
	}

	public function toArray(Request $request): array
	{
		$data = [
			'code' => $this->code,
			'name' => $this->name,
			'location_name' => $this->venue?->name,
			'city' => $this->venue?->city_province,
			'sub_location' => $this->sub_location,
			'screen_type' => $this->screen_type,
			'resolution_width' => $this->resolution_width !== null ? (int) $this->resolution_width : null,
			'resolution_height' => $this->resolution_height !== null ? (int) $this->resolution_height : null,
			'orientation' => $this->orientation,
			'aspect_ratio' => $this->aspect_ratio,
			'has_audio' => $this->has_audio !== null ? (bool) $this->has_audio : null,
			'loop_duration_seconds' => $this->loop_duration_seconds !== null ? (int) $this->loop_duration_seconds : null,
			'default_slot_seconds' => $this->default_slot_seconds !== null ? (int) $this->default_slot_seconds : null,
			'opening_time' => $this->venue?->opening_time,
			'closing_time' => $this->venue?->closing_time,
			'is_24_7' => $this->venue !== null ? (bool) $this->venue->is_24_7 : null,
			'hardware_device_uid' => $this->hardware_device_uid,
			'connectivity_status' => $this->connectivity_status,
			'last_heartbeat_at' => $this->last_heartbeat_at?->toIso8601String(),
			'status' => $this->status,
		];

		if ($this->includeSecret) {
			$data['secret_key'] = $this->secret_key;
		}

		return $data;
	}
}
