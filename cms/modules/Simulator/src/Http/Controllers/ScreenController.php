<?php

namespace Modules\Simulator\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Simulator\Http\Requests\BatchSyncSimulatorScreensRequest;
use Modules\Simulator\Http\Requests\CreateSimulatorScreenRequest;
use Modules\Simulator\Resources\SimulatorScreenResource;
use Modules\Simulator\Services\SimulatorService;

class ScreenController extends BaseController
{
	public function __construct(protected SimulatorService $simulatorService) {}

	public function index(Request $request): JsonResponse
	{
		$perPage = (int) $request->query('per_page', 50);
		$paginator = $this->simulatorService->listScreens($request->query(), $perPage);
		$paginator->through(fn ($item) => new SimulatorScreenResource($item));

		return $this->respondPaginated($paginator);
	}

	public function store(CreateSimulatorScreenRequest $request): JsonResponse
	{
		$screen = $this->simulatorService->createLocalScreen($request->validated());

		return $this->respondCreated(new SimulatorScreenResource($screen), 'Local simulator screen created.');
	}

	public function sync(Request $request, int|string $id): JsonResponse
	{
		$validated = $request->validate([
			'code' => 'required|string|max:64',
			'secret_key' => 'required|string|max:128',
		]);

		$synced = $this->simulatorService->markScreenSynced($id, $validated['code'], $validated['secret_key']);
		if (!$synced) {
			return $this->respondNotFound('Simulator screen not found.');
		}

		return $this->respondSuccess(new SimulatorScreenResource($synced), 'Screen credentials saved.');
	}

	public function batchSync(BatchSyncSimulatorScreensRequest $request): JsonResponse
	{
		$synced = $this->simulatorService->markScreensBatchSynced($request->validated()['items']);

		return $this->respondSuccess(SimulatorScreenResource::collection(collect($synced))->resolve($request), 'Batch screen credentials saved.');
	}

	public function destroy(int|string $id): JsonResponse
	{
		if (!$this->simulatorService->deleteLocalScreen($id)) {
			return $this->respondNotFound('Simulator screen not found.');
		}

		return $this->respondSuccess(null, 'Simulator screen deleted.');
	}
}
