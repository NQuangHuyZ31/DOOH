<?php

namespace Modules\User\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\User\Models\Role;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    public function findByName(string $name): ?Role;
}
