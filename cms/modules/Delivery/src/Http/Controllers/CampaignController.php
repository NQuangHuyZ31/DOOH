<?php

namespace Modules\Delivery\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Delivery\Http\Requests\StoreCampaignRequest;
use Modules\Delivery\Http\Requests\UpdateCampaignRequest;
use Modules\Delivery\Resources\CampaignResource;
use Modules\Delivery\Services\DeliveryService;

class CampaignController extends BaseController
{
	public function __construct(
		protected DeliveryService $deliveryService
	) {}

	public function index(Request $request): JsonResponse
	{
		$perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
		$filters = $request->only(['search', 'status', 'user_id']);

		$paginated = $this->deliveryService->listCampaigns($filters, $perPage);

		return $this->respondPaginated(CampaignResource::collection($paginated), 'Campaigns retrieved successfully.');
	}

	public function show(int|string $id): JsonResponse
	{
		$campaign = $this->deliveryService->getCampaign($id);
		if (!$campaign) {
			return $this->respondNotFound('Campaign not found.');
		}

		return $this->respondSuccess(new CampaignResource($campaign));
	}

	public function store(StoreCampaignRequest $request): JsonResponse
	{
		$campaign = $this->deliveryService->createCampaign($request->validated());

		return $this->respondCreated(new CampaignResource($campaign), 'Campaign created successfully.');
	}

	public function update(UpdateCampaignRequest $request, int|string $id): JsonResponse
	{
		$campaign = $this->deliveryService->updateCampaign($id, $request->validated());
		if (!$campaign) {
			return $this->respondNotFound('Campaign not found.');
		}

		return $this->respondSuccess(new CampaignResource($campaign), 'Campaign updated successfully.');
	}

	public function destroy(int|string $id): JsonResponse
	{
		$deleted = $this->deliveryService->deleteCampaign($id);
		if (!$deleted) {
			return $this->respondNotFound('Campaign not found.');
		}

		return $this->respondSuccess(['id' => (int) $id], 'Campaign deleted successfully.');
	}
}
