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
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ?string $module = null, ?string $permission = null): Response
    {
        if (!$module) {
            $prefix = trim($request->route()?->getPrefix() ?? '', '/');
            $segments = explode('/', $prefix);
            $module = end($segments);
        }

        if (in_array(strtolower($module), $this->exemptModules, true)) {
            return $next($request);
        }

        $user = $request->user();
        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        // Super Admin bypasses all permission checks
        if (method_exists($user, 'hasRole') && $user->hasRole('super_admin')) {
            return $next($request);
        }

        // Check required permission
        $requiredPermission = $permission ?? strtolower($module) . '.view';
        if (method_exists($user, 'hasPermission') && $user->hasPermission($requiredPermission)) {
            return $next($request);
        }

        return $this->respondError('Access denied: insufficient permissions', 403);
    }
}
