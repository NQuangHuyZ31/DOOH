<?php

namespace Modules\Creative\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Core\Support\UserPermissionHelper;
use Modules\Creative\Http\Requests\BatchCreateCreativeRequest;
use Modules\Creative\Http\Requests\CreateCreativeRequest;
use Modules\Creative\Http\Requests\ReviewCreativeRequest;
use Modules\Creative\Http\Requests\UpdateCreativeRequest;
use Modules\Creative\Resources\CreativeResource;
use Modules\Creative\Services\CreativeService;

class CreativeController extends BaseController
{
	public function __construct(
		protected CreativeService $creativeService
	) {}

	public function index(Request $request): JsonResponse
	{
		$perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
		$filters = $request->only(['search', 'type', 'status', 'aspect_ratio']);

		$creatives = $this->creativeService->listCreatives($filters, $perPage);

		return $this->respondPaginated(
			CreativeResource::collection($creatives),
			'Creatives retrieved successfully.'
		);
	}

	public function show(int|string $id): JsonResponse
	{
		$creative = $this->creativeService->getCreativeById((int) $id);
		if (!$creative) {
			return $this->respondNotFound('Creative not found.');
		}

		return $this->respondSuccess(new CreativeResource($creative));
	}

	public function store(CreateCreativeRequest $request): JsonResponse
	{
		$user = $request->user();
		$canReview = UserPermissionHelper::canReview($user);

		$creative = $this->creativeService->createCreative(
			$request->validated(),
			$user?->id,
			$canReview
		);

		return $this->respondCreated(
			new CreativeResource($creative),
			'Creative created successfully.'
		);
	}

	public function batch(BatchCreateCreativeRequest $request): JsonResponse
	{
		$user = $request->user();
		$canReview = UserPermissionHelper::canReview($user);

		$items = $request->validated('items');
		$created = $this->creativeService->createBatch($items, $user?->id, $canReview);

		return $this->respondCreated(
			CreativeResource::collection($created),
			'Creatives created successfully in batch.'
		);
	}

	public function update(int|string $id, UpdateCreativeRequest $request): JsonResponse
	{
		$user = $request->user();
		$canReview = UserPermissionHelper::canReview($user);

		$creative = $this->creativeService->updateCreative(
			(int) $id,
			$request->validated(),
			$user?->id,
			$canReview
		);
		if (!$creative) {
			return $this->respondNotFound('Creative not found.');
		}

		return $this->respondSuccess(
			new CreativeResource($creative),
			'Creative updated successfully.'
		);
	}

	public function destroy(int|string $id): JsonResponse
	{
		$deleted = $this->creativeService->deleteCreative((int) $id);
		if (!$deleted) {
			return $this->respondNotFound('Creative not found.');
		}

		return $this->respondSuccess(['deleted' => true], 'Creative deleted successfully.');
	}

	public function status(Request $request, int|string|null $id = null): JsonResponse
	{
		$user = $request->user();
		if (!UserPermissionHelper::canReview($user)) {
			return $this->respondForbidden('You are not authorized to review creatives.');
		}

		$validated = $request->validate([
			'ids' => ['nullable', 'array'],
			'ids.*' => ['integer'],
			'status' => ['required', 'in:approved,rejected,pending_review,draft'],
			'rejection_reason' => ['nullable', 'string', 'max:500'],
		]);

		$ids = $id ? [(int) $id] : ($validated['ids'] ?? []);
		if (empty($ids)) {
			return $this->respondError('No creatives selected for review.', 422);
		}

		if ($id) {
			$existing = $this->creativeService->getCreativeById((int) $id);
			if (!$existing) {
				return $this->respondNotFound('Creative not found.');
			}
			if ($existing->status === 'approved') {
				return $this->respondError('Approved creatives cannot have their status changed.', 422);
			}
		}

		$count = $this->creativeService->batchReview(
			$ids,
			$validated['status'],
			$validated['rejection_reason'] ?? null,
			$user?->id
		);

		if ($id) {
			$creative = $this->creativeService->getCreativeById((int) $id);
			return $this->respondSuccess(
				new CreativeResource($creative),
				"Creative status updated to {$validated['status']}."
			);
		}

		return $this->respondSuccess(
			['updated_count' => $count],
			"Successfully updated status for {$count} creative(s)."
		);
	}

	public function batchStatus(Request $request): JsonResponse
	{
		return $this->status($request);
	}
}
