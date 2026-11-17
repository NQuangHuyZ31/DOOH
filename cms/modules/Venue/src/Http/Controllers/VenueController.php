<?php

namespace Modules\Venue\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Venue\Services\VenueService;

class VenueController extends BaseController
{
    protected VenueService $venueService;

    public function __construct(VenueService $venueService)
    {
        $this->venueService = $venueService;
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        $venues = $this->venueService->listVenues($perPage);
        return $this->respondPaginated($venues);
    }

    public function show(int|string $id)
    {
        $venue = $this->venueService->getVenue($id);
        if (!$venue) {
            return $this->error('Venue not found', 404);
        }
        return $this->success($venue);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|unique:venues,code',
            'name' => 'required|string',
            'location' => 'required|string',
            'width' => 'required|integer',
            'height' => 'required|integer',
            'orientation' => 'nullable|string|in:landscape,portrait',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $venue = $this->venueService->createVenue($data);
        return $this->success($venue, 'Venue created successfully', 201);
    }

    public function update(Request $request, int|string $id)
    {
        $data = $request->validate([
            'name' => 'sometimes|string',
            'location' => 'sometimes|string',
            'width' => 'sometimes|integer',
            'height' => 'sometimes|integer',
            'orientation' => 'nullable|string|in:landscape,portrait',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $updated = $this->venueService->updateVenue($id, $data);
        return $this->success(['updated' => $updated], 'Venue updated successfully');
    }

    public function destroy(int|string $id)
    {
        $deleted = $this->venueService->deleteVenue($id);
        return $this->success(['deleted' => $deleted], 'Venue deleted successfully');
    }
}
