<?php

use Illuminate\Support\Facades\Route;

$adminPrefix = config('modules.admin_prefix', env('CMS_ADMIN_PREFIX', 'admin'));
$defaultModule = config('modules.default_module', env('CMS_DEFAULT_MODULE', 'venues'));

Route::get('/', function () use ($adminPrefix, $defaultModule) {
    return redirect("/{$adminPrefix}/{$defaultModule}");
});

Route::get("/{$adminPrefix}/{any?}", function () {
    return view('core::app');
})->where('any', '.*');

Route::get('/{any}', function () {
    return view('core::app');
})->where('any', '.*');
