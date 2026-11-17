<?php

namespace Modules\User\Services;

use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function getUserRepository(): UserRepositoryInterface
    {
        return $this->userRepository;
    }
}
