<?php

namespace Modules\User\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\User\Models\User;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    public function findByEmail(string $email): ?User;

    public function assignRole(User $user, int|string $role): void;

    /**
     * @param int[]|string[] $permissionIdsOrNames
     */
    public function syncDirectPermissions(User $user, array $permissionIdsOrNames): void;
}
