<?php

namespace Modules\Log\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class IndexController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Log',
            'version' => '1.0.0',
            'collections' => ['tracking_logs', 'system_audit_logs'],
        ], 'Log module ready');
    }
}
