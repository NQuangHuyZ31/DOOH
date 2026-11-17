<?php

namespace Modules\User\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Modules\User\Repositories\PermissionRepository;
use Modules\User\Repositories\RoleRepository;
use Modules\User\Repositories\UserRepository;

class UserServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);
        $this->app->bind(PermissionRepositoryInterface::class, PermissionRepository::class);
    }

    public function boot(): void {}
}
