<?php

namespace Modules\Venue\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Support\ApiResponseTrait;
use Modules\Venue\Services\ScreenService;

class InternalScreenController
{
	use ApiResponseTrait;

	public function __construct(protected ScreenService $screenService) {}

	public function showByCode(Request $request): JsonResponse
	{
		$code = trim((string) $request->query('code', ''));
		if ($code === '') {
			return $this->respondError('Missing required code parameter', 422);
		}

		$screen = $this->screenService->getScreenByCode($code);
		if (!$screen) {
			return $this->respondNotFound('Screen not found');
		}

		return $this->respondSuccess([
			'screen_id' => (int) $screen->id,
			'venue_id' => (int) $screen->venue_id,
			'vendor_id' => (int) ($screen->venue?->media_owner_id ?? 0),
			'code' => $screen->code,
			'secret_key' => $screen->secret_key,
			'status' => $screen->status,
		]);
	}
}
