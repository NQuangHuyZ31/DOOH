<?php

namespace Modules\Delivery\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Delivery\Services\PlaylistService;

class PlaylistController extends BaseController
{
	public function __construct(
		protected PlaylistService $playlistService
	) {}

	public function preview(Request $request): JsonResponse
	{
		$screenId = $request->integer('screen_id');
		$venueId = $request->integer('venue_id');

		if (!$screenId && !$venueId) {
			return $this->respondError('screen_id or venue_id is required', 422);
		}

		$playlist = $screenId
			? $this->playlistService->generatePlaylistForScreen($screenId)
			: $this->playlistService->generatePlaylistForVenue($venueId);

		return $this->respondSuccess($playlist, 'Playlist preview generated successfully.');
	}
}
