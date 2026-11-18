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

    public function allRoles(): Collection
    {
        return $this->roleRepository->all();
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginateRoles(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->roleRepository->paginate($perPage, $filters);
    }

    public function getRole(int $id): ?Role
    {
        return $this->roleRepository->find($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createRole(array $data): Role
    {
        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);

        $role = $this->roleRepository->create($data);

        if (!empty($permissions)) {
            $this->roleRepository->syncPermissions($role, $permissions);
        }

        return $this->roleRepository->find($role->id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updateRole(int $id, array $data): ?Role
    {
        $role = $this->roleRepository->find($id);
        if (!$role) {
            return null;
        }

        if ($role->name === 'super_admin' && isset($data['name']) && $data['name'] !== 'super_admin') {
            unset($data['name']);
        }

        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);

        if ($data !== []) {
            $this->roleRepository->update($id, $data);
        }

        if ($permissions !== null) {
            $this->roleRepository->syncPermissions($role, $permissions);
        }

        return $this->roleRepository->find($id);
    }

    public function deleteRole(int $id): bool
    {
        return $this->roleRepository->delete($id);
    }
}
