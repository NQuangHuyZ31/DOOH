<?php

namespace Modules\Venue\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Venue\Http\Requests\StoreVenueRequest;
use Modules\Venue\Http\Requests\UpdateVenueRequest;
use Modules\Venue\Resources\VenueResource;
use Modules\Venue\Services\VenueService;

class VenueController extends BaseController
{
    public function __construct(
        protected VenueService $venueService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', $this->getDefaultPerPage(15));
        $filters = $request->only(['search', 'orientation', 'status']);

        $venues = $this->venueService->listVenues($filters, $perPage);

        return $this->respondPaginated(
            VenueResource::collection($venues),
            'Venues retrieved successfully.'
        );
    }

    public function show(int|string $id): JsonResponse
    {
        $venue = $this->venueService->getVenue($id);
        if (!$venue) {
            return $this->respondNotFound('Venue not found');
        }

        return $this->respondSuccess(new VenueResource($venue));
    }

    public function store(StoreVenueRequest $request): JsonResponse
    {
        $venue = $this->venueService->createVenue($request->validated());

        return $this->respondCreated(new VenueResource($venue), 'Venue created successfully.');
    }

    public function update(UpdateVenueRequest $request, int|string $id): JsonResponse
    {
        $updated = $this->venueService->updateVenue($id, $request->validated());
        if (!$updated) {
            return $this->respondNotFound('Venue not found.');
        }

        $venue = $this->venueService->getVenue($id);

        return $this->respondSuccess(
            $venue ? new VenueResource($venue) : ['updated' => true],
            'Venue updated successfully.'
        );
    }

    public function destroy(int|string $id): JsonResponse
    {
        $deleted = $this->venueService->deleteVenue($id);
        if (!$deleted) {
            return $this->respondNotFound('Venue not found.');
        }

        return $this->respondSuccess(null, 'Venue deleted successfully.');
    }
}
