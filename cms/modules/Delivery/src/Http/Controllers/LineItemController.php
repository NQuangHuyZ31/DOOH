<?php

namespace Modules\Delivery\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Delivery\Http\Requests\BatchStoreLineItemRequest;
use Modules\Delivery\Http\Requests\StoreLineItemRequest;
use Modules\Delivery\Http\Requests\UpdateLineItemRequest;
use Modules\Delivery\Resources\LineItemResource;
use Modules\Delivery\Services\DeliveryService;

class LineItemController extends BaseController
{
	public function __construct(
		protected DeliveryService $deliveryService
	) {}

	public function index(Request $request): JsonResponse
	{
		$perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
		$filters = $request->only(['search', 'campaign_id', 'status', 'pacing_mode']);

		$paginated = $this->deliveryService->listLineItems($filters, $perPage);

		return $this->respondPaginated(LineItemResource::collection($paginated), 'Line items retrieved successfully.');
	}

	public function show(int|string $id): JsonResponse
	{
		$lineItem = $this->deliveryService->getLineItem($id);
		if (!$lineItem) {
			return $this->respondNotFound('Line item not found.');
		}

		return $this->respondSuccess(new LineItemResource($lineItem));
	}

	public function store(StoreLineItemRequest $request): JsonResponse
	{
		$lineItem = $this->deliveryService->createLineItem($request->validated());

		return $this->respondCreated(new LineItemResource($lineItem), 'Line item created successfully.');
	}

	public function batch(BatchStoreLineItemRequest $request): JsonResponse
	{
		$created = $this->deliveryService->createBatchLineItems($request->validated()['items']);

		return $this->respondCreated(LineItemResource::collection($created), count($created) . ' line items created successfully.');
	}

	public function update(UpdateLineItemRequest $request, int|string $id): JsonResponse
	{
		$lineItem = $this->deliveryService->updateLineItem($id, $request->validated());
		if (!$lineItem) {
			return $this->respondNotFound('Line item not found.');
		}

		return $this->respondSuccess(new LineItemResource($lineItem), 'Line item updated successfully.');
	}

	public function destroy(int|string $id): JsonResponse
	{
		$deleted = $this->deliveryService->deleteLineItem($id);
		if (!$deleted) {
			return $this->respondNotFound('Line item not found.');
		}

		return $this->respondSuccess(['id' => (int) $id], 'Line item deleted successfully.');
	}
}
