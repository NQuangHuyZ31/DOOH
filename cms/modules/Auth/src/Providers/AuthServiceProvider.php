<?php

namespace Modules\Auth\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Auth\Services\AuthService;
use Modules\Auth\Services\OtpService;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $configPath = dirname(__DIR__, 2) . '/configs/auth.php';
        if (file_exists($configPath)) {
            $this->mergeConfigFrom($configPath, 'auth.email_otp');
        }

        $this->app->singleton(OtpService::class);
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
