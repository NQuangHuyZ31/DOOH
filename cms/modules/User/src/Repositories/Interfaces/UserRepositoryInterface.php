<?php

namespace Modules\User\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\User\Models\User;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    public function findById(int|string $id): ?User;

    public function findByEmail(string $email): ?User;
}
