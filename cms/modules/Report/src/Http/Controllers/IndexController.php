<?php

namespace Modules\Report\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class IndexController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Report',
            'version' => '1.0.0',
            'reports' => ['daily_aggregated', 'hourly_by_venue', 'proof_of_play'],
        ], 'Report module ready');
    }
}
