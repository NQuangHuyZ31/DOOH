<?php

namespace Modules\Creative\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CreativeResource extends JsonResource
{
	public function toArray(Request $request): array
	{
		return [
			'id' => $this->id,
			'user_id' => $this->user_id,
			'creator' => $this->relationLoaded('creator') && $this->creator ? [
				'id' => $this->creator->id,
				'name' => $this->creator->name,
				'email' => $this->creator->email,
			] : null,
			'approved_by' => $this->approved_by,
			'approver' => $this->relationLoaded('approver') && $this->approver ? [
				'id' => $this->approver->id,
				'name' => $this->approver->name,
				'email' => $this->approver->email,
			] : null,
			'approved_at' => $this->approved_at?->toISOString(),
			'name' => $this->name,
			'code' => $this->code,
			'type' => $this->type,
			'status' => $this->status,
			'media_url' => $this->media_url,
			'thumbnail_url' => $this->thumbnail_url,
			'width' => (int) $this->width,
			'height' => (int) $this->height,
			'aspect_ratio' => $this->aspect_ratio,
			'duration_seconds' => $this->duration_seconds !== null ? (int) $this->duration_seconds : null,
			'file_size_bytes' => $this->file_size_bytes !== null ? (int) $this->file_size_bytes : null,
			'mime_type' => $this->mime_type,
			'rejection_reason' => $this->rejection_reason,
			'metadata' => $this->metadata,
			'created_at' => $this->created_at?->toISOString(),
			'updated_at' => $this->updated_at?->toISOString(),
		];
	}
}
