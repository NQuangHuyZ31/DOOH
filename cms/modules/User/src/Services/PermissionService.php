<?php

namespace Modules\User\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\User\Models\Permission;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;

class PermissionService
{
    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    public function getAllPermissions(array $filters = []): Collection
    {
        return $this->permissionRepository->all([
            'id',
            'name',
            'module',
            'display_name',
            'description',
        ], $filters);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginatePermissions(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->permissionRepository->paginate($perPage, $filters);
    }

    public function getPermission(int $id): ?Permission
    {
        return $this->permissionRepository->find($id);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createPermission(array $data): Permission
    {
        return $this->permissionRepository->create($data);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function updatePermission(int $id, array $data): ?Permission
    {
        $updated = $this->permissionRepository->update($id, $data);
        if (!$updated) {
            return null;
        }

        return $this->permissionRepository->find($id);
    }

    public function deletePermission(int $id): bool
    {
        return $this->permissionRepository->delete($id);
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getGroupedByModule(): array
    {
        return $this->permissionRepository->getGroupedByModule();
    }
}
