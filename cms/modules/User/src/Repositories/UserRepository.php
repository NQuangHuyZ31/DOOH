<?php

namespace Modules\User\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\Permission;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    /**
     * @var string[]
     */
    protected array $with = [
        'role:id,name,display_name,description',
        'directPermissions:id,name,module,display_name',
    ];

    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->newQuery()->where('email', $email)->first();
    }

    public function assignRole(User $user, int|string $role): void
    {
        $roleModel = is_numeric($role) ? Role::find($role) : Role::where('name', $role)->first();
        if (!$roleModel) {
            throw new \InvalidArgumentException('Role not found.');
        }

        $user->role_id = $roleModel->id;
        $user->permission_type = User::PERMISSION_TYPE_ROLE;
        $user->save();
        $user->directPermissions()->detach();
    }

    /**
     * @param int[]|string[] $permissionIdsOrNames
     */
    public function syncDirectPermissions(User $user, array $permissionIdsOrNames): void
    {
        $ids = [];
        foreach ($permissionIdsOrNames as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } else {
                $perm = Permission::where('name', $item)->first();
                if ($perm) {
                    $ids[] = $perm->id;
                }
            }
        }

        $user->role_id = null;
        $user->permission_type = User::PERMISSION_TYPE_DIRECT;
        $user->save();
        $user->directPermissions()->sync($ids);
    }
}
