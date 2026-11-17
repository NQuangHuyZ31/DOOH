<?php

namespace Modules\Auth\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Illuminate\Http\JsonResponse;

class AuthController extends BaseController
{
    public function index(): JsonResponse
    {
        return $this->respondSuccess([
            'module' => 'Auth',
            'version' => '1.0.0',
            'endpoints' => ['login', 'logout', 'me', 'refresh'],
        ], 'Auth module ready');
    }
}
