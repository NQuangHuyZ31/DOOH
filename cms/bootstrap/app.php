<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

$apiPrefix = env('CMS_API_PREFIX', 'admin/api');

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: dirname(__DIR__).'/modules/Core/routes/web.php',
        api: dirname(__DIR__).'/modules/Core/routes/api.php',
        apiPrefix: $apiPrefix,
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) use ($apiPrefix): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is("{$apiPrefix}/*") || $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
