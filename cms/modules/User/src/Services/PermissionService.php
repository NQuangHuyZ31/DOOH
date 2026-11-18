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
        $permissions = $this->getAllPermissions();

        $grouped = [];
        foreach ($permissions as $perm) {
            $module = $perm->module ?: 'other';
            $grouped[$module][] = [
                'id' => $perm->id,
                'name' => $perm->name,
                'module' => $perm->module,
                'display_name' => $perm->display_name,
                'description' => $perm->description,
            ];
        }

        return $grouped;
    }
}
