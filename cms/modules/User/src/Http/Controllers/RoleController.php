<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
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
            return $this->respondPaginated($this->roleService->getPaginatedRoles($perPage));
        }

        return $this->respondSuccess($this->roleService->getAllRoles());
    }

    public function show(int $id): JsonResponse
    {
        $role = $this->roleService->getRoleById($id);
        if (!$role) {
            return $this->respondNotFound('Role not found.');
        }

        return $this->respondSuccess($role);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:roles,name',
            'display_name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = $this->roleService->createRole($validated);

        return $this->respondCreated($role, 'Role created successfully.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        $role = $this->roleService->updateRole($id, $validated);
        if (!$role) {
            return $this->respondNotFound('Role not found.');
        }

        return $this->respondSuccess($role, 'Role updated successfully.');
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
