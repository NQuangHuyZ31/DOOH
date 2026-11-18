<?php

namespace Modules\User\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
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

    public function syncDirectPermissions(User|int $user, array $permissionIds): void
    {
        /** @var User|null $userModel */
        $userModel = $user instanceof User ? $user : $this->find($user);
        $userModel?->directPermissions()->sync($permissionIds);
    }
}
