<?php

namespace Modules\Delivery\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Support\ApiResponseTrait;
use Modules\Delivery\Services\PlaylistService;

class InternalPlaylistController
{
	use ApiResponseTrait;

	public function __construct(protected PlaylistService $playlistService) {}

	public function show(Request $request): JsonResponse
	{
		$screenId = (int) $request->query('screen_id', 0);
		$venueId = (int) $request->query('venue_id', 0);

		if ($screenId > 0) {
			return $this->respondSuccess($this->playlistService->generatePlaylistForScreen($screenId));
		}

		if ($venueId > 0) {
			return $this->respondSuccess($this->playlistService->generatePlaylistForVenue($venueId));
		}

		return $this->respondError('Missing required screen_id or venue_id parameter', 422);
	}
}
