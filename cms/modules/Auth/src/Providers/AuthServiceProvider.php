<?php

namespace Modules\Auth\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Auth\Services\AuthService;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuthService::class);
    }

    public function boot(): void
    {
        $viewsPath = dirname(__DIR__, 2) . '/resources/views';
        if (is_dir($viewsPath)) {
            $this->loadViewsFrom($viewsPath, 'auth');
        }
    }
}
