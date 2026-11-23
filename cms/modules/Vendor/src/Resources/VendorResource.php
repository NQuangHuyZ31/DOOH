<?php

namespace Modules\Vendor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
	public function toArray(Request $request): array
	{
		return [
			'id' => $this->id,
			'code' => $this->code,
			'name' => $this->name,
			'company_name' => $this->company_name,
			'tax_code' => $this->tax_code,
			'contact_name' => $this->contact_name,
			'contact_email' => $this->contact_email,
			'contact_phone' => $this->contact_phone,
			'address' => $this->address,
			'user_id' => $this->user_id,
			'user' => $this->relationLoaded('user') && $this->user ? [
				'id' => $this->user->id,
				'name' => $this->user->name,
				'email' => $this->user->email,
			] : null,
			'api_key_prefix' => $this->api_key_prefix,
			'has_api_key' => !empty($this->api_key_hash),
			'rate_limit_per_minute' => (int) $this->rate_limit_per_minute,
			'revenue_share_percentage' => (float) $this->revenue_share_percentage,
			'status' => $this->status,
			'last_active_at' => $this->last_active_at?->toISOString(),
			'created_at' => $this->created_at?->toISOString(),
			'updated_at' => $this->updated_at?->toISOString(),
		];
	}
}
