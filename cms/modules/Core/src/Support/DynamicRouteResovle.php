<?php

namespace Modules\Core\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class DynamicRouteResovle
{
    /**
     * Register dynamic routes for registered modules
     */
    public static function registerRoutes(): void
    {
        $configPath = dirname(__DIR__, 2) . '/configs/modules.php';
        $modules = file_exists($configPath) ? (require $configPath)['routes'] ?? [] : [];

        foreach ($modules as $moduleSlug) {
            Route::prefix($moduleSlug)
                ->middleware(['api'])
                ->group(function () use ($moduleSlug) {
                    Route::any('/{controller?}/{id_or_action?}/{action?}', function (
                        Request $request,
                        ?string $controller = 'index',
                        ?string $id_or_action = null,
                        ?string $action = null
                    ) use ($moduleSlug) {
                        return self::dispatch($request, $moduleSlug, $controller, $id_or_action, $action);
                    });
                });
        }
    }

    /**
     * Dispatch request to controller
     */
    protected static function dispatch(
        Request $request,
        string $moduleSlug,
        ?string $controller,
        ?string $id_or_action,
        ?string $action
    ) {
        $moduleName = Str::studly($moduleSlug);
        $controllerName = Str::studly($controller ?? 'index') . 'Controller';
        $controllerClass = "Modules\\{$moduleName}\\Http\\Controllers\\{$controllerName}";

        if (!class_exists($controllerClass)) {
            return response()->json([
                'status' => 'error',
                'message' => "Controller [{$controllerClass}] not found."
            ], 404);
        }

        $instance = app()->make($controllerClass);

        // Determine method name based on HTTP verb and action
        $method = 'index';
        $param = null;

        if ($action !== null) {
            $method = Str::camel($action);
            $param = $id_or_action;
        } elseif ($id_or_action !== null) {
            if (is_numeric($id_or_action) || Str::isUuid($id_or_action)) {
                $param = $id_or_action;
                $method = match ($request->method()) {
                    'GET' => 'show',
                    'PUT', 'PATCH' => 'update',
                    'DELETE' => 'destroy',
                    default => 'show'
                };
            } else {
                $method = Str::camel($id_or_action);
            }
        } else {
            $method = match ($request->method()) {
                'GET' => 'index',
                'POST' => 'store',
                default => 'index'
            };
        }

        if (!method_exists($instance, $method) || !(new \ReflectionMethod($instance, $method))->isPublic()) {
            return response()->json([
                'status' => 'error',
                'message' => "Action [{$method}] not found or not accessible on [{$controllerName}]."
            ], 404);
        }

        return $param !== null ? app()->call([$instance, $method], ['id' => $param]) : app()->call([$instance, $method]);
    }
}
