<?php

namespace Modules\Vendor\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Support\ApiResponseTrait;
use Modules\Vendor\Services\VendorService;

class InternalVendorController
{
	use ApiResponseTrait;

	public function __construct(protected VendorService $vendorService) {}

	public function showByKeyHash(Request $request): JsonResponse
	{
		$keyHash = trim((string) $request->query('key_hash', ''));
		if ($keyHash === '') {
			return $this->respondError('Missing required key_hash parameter', 422);
		}

		$vendor = $this->vendorService->getVendorByApiKeyHash($keyHash);
		if (!$vendor) {
			return $this->respondNotFound('Vendor not found');
		}

		return $this->respondSuccess([
			'vendor_id' => (int) ($vendor->user_id ?: $vendor->id),
			'name' => $vendor->name,
			'status' => $vendor->status,
			'rate_limit_per_min' => (int) ($vendor->rate_limit_per_minute ?? 60),
		]);
	}
}
