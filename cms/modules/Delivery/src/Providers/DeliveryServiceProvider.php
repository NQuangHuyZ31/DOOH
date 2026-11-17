<?php

namespace Modules\Delivery\Providers;

use Illuminate\Support\ServiceProvider;

class DeliveryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind repositories
    }

    public function boot(): void
    {
        $migrationPath = dirname(__DIR__, 2) . '/database/migrations';
        if (is_dir($migrationPath)) {
            $this->loadMigrationsFrom($migrationPath);
        }
    }
}
