<?php

namespace Modules\User\Http\Controllers;

use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Services\UserService;
use Illuminate\Http\JsonResponse;

class UserController extends BaseController
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(): JsonResponse
    {
        return $this->respondSuccess([], 'User module ready');
    }
}
