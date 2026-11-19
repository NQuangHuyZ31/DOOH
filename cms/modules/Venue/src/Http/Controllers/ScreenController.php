<?php

namespace Modules\Venue\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Venue\Http\Requests\StoreScreenRequest;
use Modules\Venue\Http\Requests\UpdateScreenRequest;
use Modules\Venue\Resources\ScreenResource;
use Modules\Venue\Services\ScreenService;

class ScreenController extends BaseController
{
    public function __construct(
        protected ScreenService $screenService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
        $filters = $request->only([
            'search',
            'venue_id',
            'screen_type',
            'orientation',
            'connectivity_status',
            'status',
        ]);

        $screens = $this->screenService->listScreens($filters, $perPage);

        return $this->respondPaginated(
            ScreenResource::collection($screens),
            'Screens retrieved successfully.'
        );
    }

    public function show(int|string $id): JsonResponse
    {
        $screen = $this->screenService->getScreen($id);
        if (!$screen) {
            return $this->respondNotFound('Screen not found.');
        }

        return $this->respondSuccess(new ScreenResource($screen));
    }

    public function store(StoreScreenRequest $request): JsonResponse
    {
        $screen = $this->screenService->createScreen($request->validated());

        return $this->respondCreated(new ScreenResource($screen), 'Screen created successfully.');
    }

    public function update(UpdateScreenRequest $request, int|string $id): JsonResponse
    {
        $updated = $this->screenService->updateScreen($id, $request->validated());
        if (!$updated) {
            return $this->respondNotFound('Screen not found.');
        }

        $screen = $this->screenService->getScreen($id);

        return $this->respondSuccess(
            $screen ? new ScreenResource($screen) : ['updated' => true],
            'Screen updated successfully.'
        );
    }

    public function destroy(int|string $id): JsonResponse
    {
        $deleted = $this->screenService->deleteScreen($id);
        if (!$deleted) {
            return $this->respondNotFound('Screen not found.');
        }

        return $this->respondSuccess(['deleted' => true], 'Screen deleted successfully.');
    }

    public function regenerateKey(int|string $id): JsonResponse
    {
        $newKey = $this->screenService->regenerateSecretKey($id);
        if (!$newKey) {
            return $this->respondNotFound('Screen not found.');
        }

        return $this->respondSuccess(['secret_key' => $newKey], 'Secret key regenerated successfully.');
    }

    public function generateCode(Request $request): JsonResponse
    {
        $venueCode = $request->string('venue_code')->trim()->value();
        $code = $this->screenService->generateUniqueScreenCode($venueCode ?: 'VNU');

        return $this->respondSuccess(['code' => $code]);
    }
}
