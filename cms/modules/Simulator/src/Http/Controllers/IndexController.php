<?php

namespace Modules\Simulator\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class IndexController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Simulator',
            'version' => '1.0.0',
            'description' => 'DOOH Web Player & Screen Simulator engine',
        ], 'Simulator module ready');
    }
}
