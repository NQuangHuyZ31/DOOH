<?php

namespace Modules\Venue\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VenueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'venue_type' => $this->venue_type,
            'media_owner_id' => $this->media_owner_id,
            'media_owner' => $this->relationLoaded('mediaOwner') && $this->mediaOwner ? [
                'id' => $this->mediaOwner->id,
                'name' => $this->mediaOwner->name,
            ] : null,
            'address' => $this->address,
            'ward' => $this->ward,
            'district' => $this->district,
            'city_province' => $this->city_province,
            'country_code' => $this->country_code,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'opening_time' => $this->opening_time,
            'closing_time' => $this->closing_time,
            'is_24_7' => (bool) $this->is_24_7,
            'daily_traffic' => $this->daily_traffic !== null ? (int) $this->daily_traffic : null,
            'contact_name' => $this->contact_name,
            'contact_phone' => $this->contact_phone,
            'status' => $this->status,
            'screens_count' => $this->whenLoaded('screens', fn() => $this->screens->count()),
            'screens' => ScreenResource::collection($this->whenLoaded('screens')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
