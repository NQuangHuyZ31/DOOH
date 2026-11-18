<?php

namespace Modules\User\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\Permission;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;

class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface
{
    public function __construct(Permission $model)
    {
        parent::__construct($model);
    }

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getGroupedByModule(): array
    {
        $permissions = $this->all(['id', 'name', 'module', 'display_name', 'description']);

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
