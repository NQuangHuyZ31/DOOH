<?php

namespace Modules\Core\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Modules\Core\Support\ModuleRegistry;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services and auto-discover module providers.
     */
    public function register(): void
    {
        $corePath = dirname(__DIR__, 2);
        $configFile = "{$corePath}/configs/modules.php";
        if (file_exists($configFile)) {
            $this->mergeConfigFrom($configFile, 'modules');
        }

        $metadataConfigFile = "{$corePath}/configs/metadata.php";
        if (file_exists($metadataConfigFile)) {
            $this->mergeConfigFrom($metadataConfigFile, 'metadata');
        }

        $this->app->scoped(ModuleRegistry::class, function () {
            return new ModuleRegistry(
                base_path('modules'),
                config('modules.disabled', [])
            );
        });

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

        // 2. Register modular Blade directives for entrypoints.json
        $this->registerBladeDirectives();

        // 3. Auto-discover migrations from all modules
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

        $this->app->terminating(function () {
            if ($this->app->bound(ModuleRegistry::class)) {
                $this->app->make(ModuleRegistry::class)->resetDomCache();
            }
        });
    }

    /**
     * Register modular Blade directives for DOM-ing assets from entrypoints.json.
     */
    protected function registerBladeDirectives(): void
    {
        Blade::directive('moduleCss', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderCss($expr); ?>";
        });

        Blade::directive('moduleJs', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderJs($expr); ?>";
        });

        Blade::directive('moduleAssets', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderAssets($expr); ?>";
        });
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
