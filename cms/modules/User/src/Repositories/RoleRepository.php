<?php

namespace Modules\User\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\Role;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    public function findByName(string $name): ?Role
    {
        return $this->model->where('name', $name)->first();
    }
}
