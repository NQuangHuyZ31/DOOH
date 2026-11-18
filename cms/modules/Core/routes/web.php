<?php

use Illuminate\Support\Facades\Route;

$adminPrefix = config('modules.admin_prefix', 'admin');
$defaultModule = config('modules.default_module', 'venues');

Route::get('/', function () use ($adminPrefix, $defaultModule) {
    return redirect("/{$adminPrefix}/{$defaultModule}");
});

Route::get("/{$adminPrefix}/{any?}", function () {
    return view('core::app');
})->where('any', '^(?!api).*$');

Route::get('/{any}', function () {
    return view('core::app');
})->where('any', '^(?!admin\/api|api).*$');
