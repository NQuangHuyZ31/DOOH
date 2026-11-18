<?php

namespace Modules\User\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface PermissionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function getGroupedByModule(): array;
}
