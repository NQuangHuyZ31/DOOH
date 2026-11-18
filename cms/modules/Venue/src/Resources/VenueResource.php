<?php

namespace Modules\Venue\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Venue\Models\Venue;

/**
 * @mixin Venue
 */
class VenueResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'location' => $this->location,
            'width' => (int) $this->width,
            'height' => (int) $this->height,
            'orientation' => $this->orientation,
            'status' => $this->status,
            'secret_key' => $this->secret_key,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
