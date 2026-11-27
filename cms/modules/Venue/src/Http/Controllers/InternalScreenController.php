<?php

namespace Modules\Venue\Http\Controllers;

use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Venue\Http\Requests\BatchRegisterPartnerScreensRequest;
use Modules\Venue\Http\Requests\RegisterPartnerScreenRequest;
use Modules\Venue\Http\Requests\ScreenHeartbeatRequest;
use Modules\Venue\Resources\PartnerScreenResource;
use Modules\Venue\Services\PartnerScreenService;
use Modules\Venue\Services\ScreenService;

class InternalScreenController extends BaseController
{
	public function __construct(
		protected ScreenService $screenService,
		protected PartnerScreenService $partnerScreenService
	) {}

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

	public function register(RegisterPartnerScreenRequest $request): JsonResponse
	{
		$validated = $request->validated();
		try {
			$screen = $this->partnerScreenService->registerScreen((int) $validated['vendor_id'], $validated);

			return $this->respondSuccess((new PartnerScreenResource($screen, true))->toArray($request), 'Screen registered', 201);
		} catch (DomainException $e) {
			return $this->respondError($e->getMessage(), 409);
		}
	}

	public function registerBatch(BatchRegisterPartnerScreensRequest $request): JsonResponse
	{
		$validated = $request->validated();
		$result = $this->partnerScreenService->registerScreensBatch((int) $validated['vendor_id'], $validated['screens']);
		$result['created'] = array_map(
			fn (array $entry) => array_merge(['index' => $entry['index']], (new PartnerScreenResource($entry['screen'], true))->toArray($request)),
			$result['created']
		);

		return $this->respondSuccess($result, 'Batch screen registration completed');
	}

	public function listByVendor(Request $request): JsonResponse
	{
		$vendorId = (int) $request->query('vendor_id', 0);
		if ($vendorId <= 0) {
			return $this->respondError('Missing required vendor_id parameter', 422);
		}

		$screens = $this->partnerScreenService->listScreens($vendorId);

		return $this->respondSuccess(PartnerScreenResource::collection($screens)->resolve($request), 'Screens retrieved');
	}

	public function configByCode(Request $request): JsonResponse
	{
		$code = trim((string) $request->query('code', ''));
		if ($code === '') {
			return $this->respondError('Missing required code parameter', 422);
		}

		$screen = $this->screenService->getScreenByCode($code);
		if (!$screen) {
			return $this->respondNotFound('Screen not found');
		}

		return $this->respondSuccess((new PartnerScreenResource($screen, false))->toArray($request), 'Screen config retrieved');
	}

	public function heartbeat(ScreenHeartbeatRequest $request): JsonResponse
	{
		$validated = $request->validated();
		$screen = $this->partnerScreenService->recordHeartbeat($validated['code'], $validated);
		if (!$screen) {
			return $this->respondNotFound('Screen not found');
		}

		return $this->respondSuccess([
			'code' => $screen->code,
			'connectivity_status' => $screen->connectivity_status,
			'last_heartbeat_at' => $screen->last_heartbeat_at?->toIso8601String(),
		], 'Heartbeat recorded');
	}
}
