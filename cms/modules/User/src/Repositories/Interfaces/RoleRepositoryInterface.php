<?php

namespace Modules\User\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\User\Models\Role;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * @param int[] $permissionIds
     */
    public function syncPermissions(Role $role, array $permissionIds): void;
}
