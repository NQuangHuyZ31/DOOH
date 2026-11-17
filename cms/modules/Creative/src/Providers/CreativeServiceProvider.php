<?php

namespace Modules\Creative\Providers;

use Illuminate\Support\ServiceProvider;

class CreativeServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $migrationPath = dirname(__DIR__, 2) . '/database/migrations';
        if (is_dir($migrationPath)) {
            $this->loadMigrationsFrom($migrationPath);
        }
    }
}
