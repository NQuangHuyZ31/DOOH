<?php

namespace Modules\Venue\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScreenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'venue_id' => $this->venue_id,
            'code' => $this->code,
            'name' => $this->name,
            'sub_location' => $this->sub_location,
            'screen_type' => $this->screen_type,
            'resolution_width' => (int) $this->resolution_width,
            'resolution_height' => (int) $this->resolution_height,
            'orientation' => $this->orientation,
            'aspect_ratio' => $this->aspect_ratio,
            'physical_width_m' => $this->physical_width_m !== null ? (float) $this->physical_width_m : null,
            'physical_height_m' => $this->physical_height_m !== null ? (float) $this->physical_height_m : null,
            'pixel_pitch_mm' => $this->pixel_pitch_mm !== null ? (float) $this->pixel_pitch_mm : null,
            'brightness_nits' => $this->brightness_nits !== null ? (int) $this->brightness_nits : null,
            'has_audio' => (bool) $this->has_audio,
            'loop_duration_seconds' => (int) $this->loop_duration_seconds,
            'default_slot_seconds' => (int) $this->default_slot_seconds,
            'hardware_device_uid' => $this->hardware_device_uid,
            'secret_key' => $this->secret_key,
            'connectivity_status' => $this->connectivity_status,
            'last_heartbeat_at' => $this->last_heartbeat_at?->toISOString(),
            'player_app_version' => $this->player_app_version,
            'ip_address' => $this->ip_address,
            'storage_free_mb' => $this->storage_free_mb !== null ? (int) $this->storage_free_mb : null,
            'status' => $this->status,
            'venue' => $this->whenLoaded('venue', fn() => [
                'id' => $this->venue->id,
                'name' => $this->venue->name,
                'code' => $this->venue->code,
                'city_province' => $this->venue->city_province,
                'venue_type' => $this->venue_type ?? $this->venue->venue_type,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
