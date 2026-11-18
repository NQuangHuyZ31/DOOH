<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Http\Requests\StoreRoleRequest;
use Modules\User\Http\Requests\UpdateRoleRequest;
use Modules\User\Resources\RoleResource;
use Modules\User\Services\RoleService;

class RoleController extends BaseController
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    public function index(Request $request): JsonResponse
    {
        if ($request->boolean('paginate')) {
            $perPage = $request->integer('per_page', 15);
            $paginated = $this->roleService->paginateRoles($perPage);

            return $this->respondPaginated(RoleResource::collection($paginated));
        }

        return $this->respondSuccess(RoleResource::collection($this->roleService->allRoles()));
    }

    public function show(int $id): JsonResponse
    {
        $role = $this->roleService->getRole($id);
        if (!$role) {
            return $this->respondNotFound('Role not found.');
        }

        return $this->respondSuccess(new RoleResource($role));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roleService->createRole($request->validated());

        return $this->respondCreated(new RoleResource($role), 'Role created successfully.');
    }

    public function update(UpdateRoleRequest $request, int $id): JsonResponse
    {
        $role = $this->roleService->updateRole($id, $request->validated());
        if (!$role) {
            return $this->respondNotFound('Role not found.');
        }

        return $this->respondSuccess(new RoleResource($role), 'Role updated successfully.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->roleService->deleteRole($id);
        if (!$deleted) {
            return $this->respondError('Cannot delete role. Super admin role is protected or role does not exist.', 400);
        }

        return $this->respondSuccess(null, 'Role deleted successfully.');
    }
}
