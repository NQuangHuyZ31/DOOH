<?php

namespace Modules\Simulator\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Simulator\Services\SimulatorService;

class SimulatorController extends BaseController
{
	public function __construct(protected SimulatorService $simulatorService) {}

	public function index(): JsonResponse
	{
		return $this->respondSuccess([
			'module' => 'Simulator',
			'version' => '1.0.0',
			'description' => 'DOOH Web Player & Screen Simulator engine',
		], 'Simulator module ready');
	}

	public function parseVast(Request $request): JsonResponse
	{
		$validated = $request->validate(['url' => ['required', 'url']]);

		try {
			return $this->respondSuccess($this->simulatorService->parseVastTag($validated['url']), 'VAST tag parsed successfully.');
		} catch (\Throwable $e) {
			return $this->respondError($e->getMessage() ?: 'Unable to fetch or parse VAST XML endpoint.', 422);
		}
	}
}
