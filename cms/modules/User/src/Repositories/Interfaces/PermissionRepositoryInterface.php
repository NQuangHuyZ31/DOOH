<?php

namespace Modules\User\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface PermissionRepositoryInterface extends BaseRepositoryInterface
{
    public function getByModule(string $module): Collection;
}
