<?php

namespace Modules\User\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\User\Models\Role;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;

class RoleService
{
    public function __construct(
        protected RoleRepositoryInterface $roleRepository
    ) {}

    public function getAllRoles(): Collection
    {
        return $this->roleRepository->getModel()
            ->with(['permissions:id,name,module,display_name'])
            ->withCount('users')
            ->get();
    }

    public function getPaginatedRoles(int $perPage = 15): LengthAwarePaginator
    {
        return $this->roleRepository->getModel()
            ->with(['permissions:id,name,module,display_name'])
            ->withCount('users')
            ->paginate($perPage);
    }

    public function getRoleById(int $id): ?Role
    {
        /** @var Role|null $role */
        $role = $this->roleRepository->getModel()
            ->with(['permissions:id,name,module,display_name'])
            ->withCount('users')
            ->find($id);

        return $role;
    }

    public function createRole(array $data): Role
    {
        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        /** @var Role $role */
        $role = $this->roleRepository->create($data);

        if (!empty($permissions)) {
            $role->permissions()->sync($permissions);
        }

        return $role->load(['permissions:id,name,module,display_name'])->loadCount('users');
    }

    public function updateRole(int $id, array $data): ?Role
    {
        /** @var Role|null $role */
        $role = $this->roleRepository->find($id);
        if (!$role) {
            return null;
        }

        // Prevent renaming super_admin
        if ($role->name === 'super_admin' && isset($data['name']) && $data['name'] !== 'super_admin') {
            unset($data['name']);
        }

        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);

        $role->update($data);

        if ($permissions !== null) {
            $role->permissions()->sync($permissions);
        }

        return $role->load(['permissions:id,name,module,display_name'])->loadCount('users');
    }

    public function deleteRole(int $id): bool
    {
        /** @var Role|null $role */
        $role = $this->roleRepository->find($id);
        if (!$role) {
            return false;
        }

        if ($role->name === 'super_admin') {
            return false;
        }

        return (bool) $role->delete();
    }
}
