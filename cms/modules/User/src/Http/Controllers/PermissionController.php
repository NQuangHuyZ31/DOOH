<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Http\Requests\StorePermissionRequest;
use Modules\User\Http\Requests\UpdatePermissionRequest;
use Modules\User\Resources\PermissionResource;
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

        $filters = $request->only(['search', 'module']);

        if ($request->boolean('paginate')) {
            $perPage = $request->integer('per_page', 15);
            $paginated = $this->permissionService->paginatePermissions($perPage, $filters);

            return $this->respondPaginated(PermissionResource::collection($paginated));
        }

        return $this->respondSuccess(PermissionResource::collection($this->permissionService->getAllPermissions($filters)));
    }

    public function show(int $id): JsonResponse
    {
        $permission = $this->permissionService->getPermission($id);
        if (!$permission) {
            return $this->respondNotFound('Permission not found.');
        }

        return $this->respondSuccess(new PermissionResource($permission));
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = $this->permissionService->createPermission($request->validated());

        return $this->respondCreated(new PermissionResource($permission), 'Permission created successfully.');
    }

    public function update(UpdatePermissionRequest $request, int $id): JsonResponse
    {
        $permission = $this->permissionService->updatePermission($id, $request->validated());
        if (!$permission) {
            return $this->respondNotFound('Permission not found.');
        }

        return $this->respondSuccess(new PermissionResource($permission), 'Permission updated successfully.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->permissionService->deletePermission($id);
        if (!$deleted) {
            return $this->respondNotFound('Permission not found.');
        }

        return $this->respondSuccess(null, 'Permission deleted successfully.');
    }
}
