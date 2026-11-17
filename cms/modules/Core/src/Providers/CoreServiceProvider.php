<?php

namespace Modules\Core\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Core\Support\DynamicRouteResovle;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind any core contracts
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Auto-discover migrations from all modules
        $modulesPath = dirname(__DIR__, 2);
        if (is_dir($modulesPath)) {
            foreach (scandir($modulesPath) as $module) {
                if ($module === '.' || $module === '..') {
                    continue;
                }
                $migrationDir = "{$modulesPath}/{$module}/database/migrations";
                if (is_dir($migrationDir)) {
                    $this->loadMigrationsFrom($migrationDir);
                }
            }
        }
    }
}
