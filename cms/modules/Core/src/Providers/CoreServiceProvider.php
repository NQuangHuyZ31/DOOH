<?php

namespace Modules\Core\Providers;

use Illuminate\Support\ServiceProvider;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services and auto-discover module providers.
     */
    public function register(): void
    {
        $this->registerModuleProviders();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $corePath = dirname(__DIR__, 2);    // cms/modules/Core
        $modulesPath = dirname(__DIR__, 3); // cms/modules

        // 1. Load Core views
        $viewsPath = "{$corePath}/resources/views";
        if (is_dir($viewsPath)) {
            $this->loadViewsFrom($viewsPath, 'core');
            $this->app['view']->addLocation($viewsPath);
        }

        // 2. Auto-discover migrations from all modules
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

    /**
     * Automatically scan and register service providers from all modules.
     */
    protected function registerModuleProviders(): void
    {
        $modulesPath = dirname(__DIR__, 3); // cms/modules
        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (scandir($modulesPath) as $module) {
            if ($module === '.' || $module === '..' || $module === 'Core') {
                continue;
            }

            $providerClass = "Modules\\{$module}\\Providers\\{$module}ServiceProvider";
            if (class_exists($providerClass)) {
                $this->app->register($providerClass);
            }
        }
    }
}
