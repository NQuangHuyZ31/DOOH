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
		$creative = $this->creativeService->updateCreative((int) $id, $request->validated());
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

	public function status(int|string $id, ReviewCreativeRequest $request): JsonResponse
	{
		$user = $request->user();
		if (!UserPermissionHelper::canReview($user)) {
			return $this->respondForbidden('You are not authorized to review creatives.');
		}

		$validated = $request->validated();
		$creative = $this->creativeService->reviewCreative(
			(int) $id,
			$validated['status'],
			$validated['rejection_reason'] ?? null,
			$user?->id
		);

		if (!$creative) {
			return $this->respondNotFound('Creative not found.');
		}

		return $this->respondSuccess(
			new CreativeResource($creative),
			"Creative status updated to {$validated['status']}."
		);
	}
}
