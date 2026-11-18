<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Services\PermissionService;

class PermissionController extends BaseController
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->boolean('grouped')) {
            return $this->respondSuccess($this->permissionService->getGroupedByModule());
        }

        return $this->respondSuccess($this->permissionService->getAllPermissions());
    }
}
