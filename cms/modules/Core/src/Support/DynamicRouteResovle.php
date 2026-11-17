<?php

namespace Modules\Core\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Modules\Core\Http\Middleware\CheckModulePermission;
use ReflectionMethod;

class DynamicRouteResovle
{
    public static function registerRoutes(): void
    {
        $modules = self::getRegisteredModuleRoutes();

        foreach ($modules as $moduleSlug) {
            $middlewares = ['api'];
            if ($moduleSlug !== 'auth') {
                $middlewares[] = CheckModulePermission::class;
            }

            Route::prefix($moduleSlug)
                ->middleware($middlewares)
                ->group(function () use ($moduleSlug) {
                    Route::any('/{controller?}/{id_or_action?}/{action?}', function (
                        Request $request,
                        ?string $controller = null,
                        ?string $id_or_action = null,
                        ?string $action = null
                    ) use ($moduleSlug) {
                        return self::dispatch($request, $moduleSlug, $controller, $id_or_action, $action);
                    });
                });
        }
    }

    protected static function dispatch(
        Request $request,
        string $moduleSlug,
        ?string $controller,
        ?string $idOrAction,
        ?string $action
    ): mixed {
        $moduleName = Str::studly($moduleSlug);

        if (self::isResourceIdentifier($controller)) {
            $action = $idOrAction;
            $idOrAction = $controller;
            $controller = $moduleSlug;
        }

        $resolved = self::resolveControllerTarget($moduleName, $moduleSlug, $controller, $idOrAction, $action);
        if (isset($resolved['error'])) {
            return self::jsonError($resolved['error'], 404);
        }

        $controllerClass = $resolved['class'];
        $controllerName = $resolved['name'];
        $idOrAction = $resolved['id_or_action'];
        $action = $resolved['action'];

        $instance = app()->make($controllerClass);
        [$method, $param] = self::resolveActionAndParameter($request, $idOrAction, $action);

        if (!self::isAccessibleAction($instance, $method)) {
            return self::jsonError("Action [{$method}] not found or not accessible on [{$controllerName}].", 404);
        }

        return $param !== null
            ? app()->call([$instance, $method], ['id' => $param])
            : app()->call([$instance, $method]);
    }

    /**
     * @return string[]
     */
    protected static function getRegisteredModuleRoutes(): array
    {
        $configured = config('modules.routes');
        if (is_array($configured) && !empty($configured)) {
            return $configured;
        }

        $configPath = dirname(__DIR__, 2) . '/configs/modules.php';

        return file_exists($configPath) ? ((require $configPath)['routes'] ?? []) : [];
    }

    /**
     * @return array{class?: string, name?: string, id_or_action?: ?string, action?: ?string, error?: string}
     */
    protected static function resolveControllerTarget(
        string $moduleName,
        string $moduleSlug,
        ?string $controller,
        ?string $idOrAction,
        ?string $action
    ): array {
        $targetController = (!empty($controller) && strtolower($controller) !== 'index') ? $controller : $moduleSlug;
        $controllerName = Str::studly($targetController) . 'Controller';
        $controllerClass = "Modules\\{$moduleName}\\Http\\Controllers\\{$controllerName}";

        if (class_exists($controllerClass)) {
            return [
                'class' => $controllerClass,
                'name' => $controllerName,
                'id_or_action' => $idOrAction,
                'action' => $action,
            ];
        }

        $domainControllerName = "{$moduleName}Controller";
        $domainControllerClass = "Modules\\{$moduleName}\\Http\\Controllers\\{$domainControllerName}";

        if (class_exists($domainControllerClass)) {
            return [
                'class' => $domainControllerClass,
                'name' => $domainControllerName,
                'id_or_action' => $controller,
                'action' => $idOrAction,
            ];
        }

        return [
            'error' => "Controller [{$controllerClass}] not found.",
        ];
    }

    /**
     * @return array{0: string, 1: ?string}
     */
    protected static function resolveActionAndParameter(
        Request $request,
        ?string $idOrAction,
        ?string $action
    ): array {
        if ($action !== null) {
            return [Str::camel($action), $idOrAction];
        }

        if ($idOrAction !== null) {
            if (self::isResourceIdentifier($idOrAction)) {
                $method = match ($request->method()) {
                    'GET' => 'show',
                    'PUT', 'PATCH' => 'update',
                    'DELETE' => 'destroy',
                    default => 'show',
                };

                return [$method, $idOrAction];
            }

            return [Str::camel($idOrAction), null];
        }

        $method = match ($request->method()) {
            'POST' => 'store',
            default => 'index',
        };

        return [$method, null];
    }

    protected static function isResourceIdentifier(?string $segment): bool
    {
        return $segment !== null && (is_numeric($segment) || Str::isUuid($segment));
    }

    protected static function isAccessibleAction(object $instance, string $method): bool
    {
        return method_exists($instance, $method) && (new ReflectionMethod($instance, $method))->isPublic();
    }

    protected static function jsonError(string $message, int $statusCode = 404): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
        ], $statusCode);
    }
}
