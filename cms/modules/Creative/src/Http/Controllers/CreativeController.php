<?php

namespace Modules\Creative\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Core\Support\UserPermissionHelper;
use Modules\Creative\Http\Requests\BatchCreateCreativeRequest;
use Modules\Creative\Http\Requests\CreateCreativeRequest;
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
		[$user, $userId, $canReview] = $this->getAuthReviewContext($request);
		$creative = $this->creativeService->createCreative($request->validated(), $userId, $canReview);

		return $this->respondCreated(new CreativeResource($creative), 'Creative created successfully.');
	}

	public function batch(BatchCreateCreativeRequest $request): JsonResponse
	{
		[$user, $userId, $canReview] = $this->getAuthReviewContext($request);
		$created = $this->creativeService->createBatch($request->validated('items'), $userId, $canReview);

		return $this->respondCreated(CreativeResource::collection($created), 'Creatives created successfully in batch.');
	}

	public function update(int|string $id, UpdateCreativeRequest $request): JsonResponse
	{
		[$user, $userId, $canReview] = $this->getAuthReviewContext($request);
		$creative = $this->creativeService->updateCreative((int) $id, $request->validated(), $userId, $canReview);
		if (!$creative) {
			return $this->respondNotFound('Creative not found.');
		}

		return $this->respondSuccess(new CreativeResource($creative), 'Creative updated successfully.');
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
		[$user, $userId, $canReview] = $this->getAuthReviewContext($request);
		if (!$canReview) {
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

		try {
			if ($id) {
				$creative = $this->creativeService->reviewCreative((int) $id, $validated['status'], $validated['rejection_reason'] ?? null, $userId);
				if (!$creative) {
					return $this->respondNotFound('Creative not found.');
				}

				return $this->respondSuccess(new CreativeResource($creative), "Creative status updated to {$validated['status']}.");
			}

			$count = $this->creativeService->batchReview($ids, $validated['status'], $validated['rejection_reason'] ?? null, $userId);

			return $this->respondSuccess(['updated_count' => $count], "Successfully updated status for {$count} creative(s).");
		} catch (\DomainException $e) {
			return $this->respondError($e->getMessage(), 422);
		}
	}

	public function batchStatus(Request $request): JsonResponse
	{
		return $this->status($request);
	}

	public function parseVast(Request $request): JsonResponse
	{
		$validated = $request->validate([
			'url' => ['required_without:xml', 'nullable', 'string'],
			'xml' => ['required_without:url', 'nullable', 'string'],
		]);

		$input = $validated['url'] ?? $validated['xml'];

		try {
			$parsed = $this->creativeService->parseVast($input);
			return $this->respondSuccess($parsed, 'VAST XML parsed successfully.');
		} catch (\DomainException $e) {
			return $this->respondError($e->getMessage(), 422);
		}
	}

	protected function getAuthReviewContext(Request $request): array
	{
		$user = $request->user();
		return [$user, $user?->id, UserPermissionHelper::canReview($user)];
	}
}
