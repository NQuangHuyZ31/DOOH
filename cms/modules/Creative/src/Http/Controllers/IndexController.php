<?php

namespace Modules\Creative\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class IndexController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Creative',
            'version' => '1.0.0',
            'supported_formats' => ['image/jpeg', 'image/png', 'video/mp4', 'application/vast+xml'],
        ], 'Creative module ready');
    }
}
