<?php

namespace Modules\Simulator\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimulatorScreenResource extends JsonResource
{
	public function toArray(Request $request): array
	{
		$baseUrl = rtrim((string) config('simulator.node_api_url', 'http://localhost:3000'), '/');
		$prefix = '/' . trim((string) config('simulator.node_api_prefix', '/api/v1'), '/');

		return [
			'id' => $this->id,
			'name' => $this->name,
			'location_name' => $this->location_name,
			'city' => $this->city,
			'sub_location' => $this->sub_location,
			'screen_type' => $this->screen_type,
			'resolution_width' => $this->resolution_width !== null ? (int) $this->resolution_width : null,
			'resolution_height' => $this->resolution_height !== null ? (int) $this->resolution_height : null,
			'orientation' => $this->orientation,
			'aspect_ratio' => $this->aspect_ratio,
			'has_audio' => $this->has_audio !== null ? (bool) $this->has_audio : null,
			'loop_duration_seconds' => $this->loop_duration_seconds !== null ? (int) $this->loop_duration_seconds : null,
			'default_slot_seconds' => $this->default_slot_seconds !== null ? (int) $this->default_slot_seconds : null,
			'opening_time' => $this->opening_time,
			'closing_time' => $this->closing_time,
			'is_24_7' => $this->is_24_7 !== null ? (bool) $this->is_24_7 : null,
			'hardware_device_uid' => $this->hardware_device_uid,
			'sync_status' => $this->sync_status,
			'code' => $this->synced_code,
			'secret_key' => $this->synced_secret_key,
			'node_api_url' => "{$baseUrl}{$prefix}",
			'synced_at' => $this->synced_at?->toISOString(),
			'created_at' => $this->created_at?->toISOString(),
		];
	}
}
