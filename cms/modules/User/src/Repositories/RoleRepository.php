<?php

namespace Modules\User\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\Role;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    protected array $with = [
        'permissions:id,name,module,display_name',
    ];

    protected array $withCount = [
        'users',
    ];

    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    public function findByName(string $name): ?Role
    {
        return $this->newQuery()->where('name', $name)->first();
    }

    public function syncPermissions(Role $role, array $permissionIds): void
    {
        $role->permissions()->sync($permissionIds);
    }

    public function delete(int|string $id): bool
    {
        $role = $this->find($id);
        if (!$role || $role->name === 'super_admin') {
            return false;
        }

        return (bool) $role->delete();
    }
}
