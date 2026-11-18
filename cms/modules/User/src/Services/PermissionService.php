<?php

namespace Modules\User\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;

class PermissionService
{
    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    public function getAllPermissions(): Collection
    {
        return $this->permissionRepository->all([
            'id',
            'name',
            'module',
            'display_name',
            'description',
        ]);
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getGroupedByModule(): array
    {
        return $this->permissionRepository->getGroupedByModule();
    }
}
