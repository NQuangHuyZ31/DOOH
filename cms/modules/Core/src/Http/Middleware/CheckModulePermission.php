<?php

namespace Modules\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Core\Support\ApiResponseTrait;
use Symfony\Component\HttpFoundation\Response;

class CheckModulePermission
{
    use ApiResponseTrait;

    /**
     * Modules exempt from permission checks.
     *
     * @var string[]
     */
    protected array $exemptModules = [
        'auth',
    ];

    /**
     * Modules requiring authentication only (exempt from module-specific RBAC permission checks).
     *
     * @var string[]
     */
    protected array $authOnlyModules = [
        'core',
    ];

    public function handle(Request $request, Closure $next, ?string $module = null, ?string $permission = null): Response
    {
        $resolvedModule = $this->resolveModuleName($request, $module);

        if (in_array($resolvedModule, $this->exemptModules, true)) {
            return $next($request);
        }

        $user = $this->resolveAuthenticatedUser($request);
        if (!$user) {
            return $this->respondUnauthorized('Unauthenticated.');
        }

        if (in_array($resolvedModule, $this->authOnlyModules, true)) {
            return $next($request);
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('super_admin')) {
            return $next($request);
        }

        $requiredPermission = $this->resolveRequiredPermission($request, $resolvedModule, $permission);
        if (method_exists($user, 'hasPermission') && $user->hasPermission($requiredPermission)) {
            return $next($request);
        }

        return $this->respondForbidden('Access denied: insufficient permissions');
    }

    protected function resolveModuleName(Request $request, ?string $module): string
    {
        if ($module) {
            return strtolower($module);
        }

        $prefix = trim($request->route()?->getPrefix() ?? '', '/');
        $segments = explode('/', $prefix);

        return strtolower((string) end($segments));
    }

    protected function resolveAuthenticatedUser(Request $request): mixed
    {
        $user = $request->user() ?? auth('sanctum')->user();

        if ($user) {
            if (!$request->user()) {
                $request->setUserResolver(fn () => $user);
            }
            auth()->setUser($user);
        }

        return $user;
    }

    protected function resolveRequiredPermission(Request $request, string $module, ?string $permission): string
    {
        if ($permission !== null) {
            return $permission;
        }

        $action = match (strtoupper($request->method())) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'edit',
            'DELETE' => 'delete',
            default => 'view',
        };

        return "{$module}.{$action}";
    }
}
