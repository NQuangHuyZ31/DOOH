<?php

namespace Modules\User\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\Permission;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;

class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface
{
    public function __construct(Permission $model)
    {
        parent::__construct($model);
    }

    public function getByModule(string $module): Collection
    {
        return $this->model->where('module', $module)->get();
    }
}
