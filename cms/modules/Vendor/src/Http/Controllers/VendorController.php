<?php

namespace Modules\Vendor\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Vendor\Http\Requests\StoreVendorRequest;
use Modules\Vendor\Http\Requests\UpdateVendorRequest;
use Modules\Vendor\Resources\VendorResource;
use Modules\Vendor\Services\VendorService;

class VendorController extends BaseController
{
	public function __construct(
		protected VendorService $vendorService
	) {}

	public function index(Request $request): JsonResponse
	{
		$perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
		$filters = $request->only(['search', 'status', 'user_id']);

		$vendors = $this->vendorService->listVendors($filters, $perPage);

		return $this->respondPaginated(
			VendorResource::collection($vendors),
			'Vendors retrieved successfully.'
		);
	}

	public function show(int|string $id): JsonResponse
	{
		$vendor = $this->vendorService->getVendor($id);
		if (!$vendor) {
			return $this->respondNotFound('Vendor not found.');
		}

		return $this->respondSuccess(new VendorResource($vendor));
	}

	public function store(StoreVendorRequest $request): JsonResponse
	{
		$result = $this->vendorService->createVendor($request->validated());

		return $this->respondCreated([
			'vendor' => new VendorResource($result['vendor']),
			'plain_api_key' => $result['plain_api_key'],
		], 'Vendor created successfully.');
	}

	public function update(UpdateVendorRequest $request, int|string $id): JsonResponse
	{
		$vendor = $this->vendorService->updateVendor($id, $request->validated());
		if (!$vendor) {
			return $this->respondNotFound('Vendor not found.');
		}

		return $this->respondSuccess(new VendorResource($vendor), 'Vendor updated successfully.');
	}

	public function destroy(int|string $id): JsonResponse
	{
		$deleted = $this->vendorService->deleteVendor($id);
		if (!$deleted) {
			return $this->respondNotFound('Vendor not found.');
		}

		return $this->respondSuccess(['id' => (int) $id], 'Vendor deleted successfully.');
	}

	public function regenerateApiKey(int|string $id): JsonResponse
	{
		$result = $this->vendorService->regenerateApiKey($id);
		if (!$result) {
			return $this->respondNotFound('Vendor not found.');
		}

		return $this->respondSuccess([
			'vendor' => new VendorResource($result['vendor']),
			'plain_api_key' => $result['plain_api_key'],
		], 'API key regenerated successfully.');
	}
}
