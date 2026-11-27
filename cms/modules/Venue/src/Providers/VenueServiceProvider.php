<?php

namespace Modules\Venue\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Core\Http\Middleware\VerifyInternalSecret;
use Modules\Venue\Http\Controllers\InternalScreenController;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;
use Modules\Venue\Repositories\ScreenRepository;
use Modules\Venue\Repositories\VenueRepository;

class VenueServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$configPath = dirname(__DIR__, 2) . '/configs/venue.php';
		if (file_exists($configPath)) {
			$this->mergeConfigFrom($configPath, 'venue');
		}

		$this->app->bind(VenueRepositoryInterface::class, VenueRepository::class);
		$this->app->bind(ScreenRepositoryInterface::class, ScreenRepository::class);
	}

	public function boot(): void
	{
		$prefix = trim((string) config('modules.api_prefix', 'admin/api'), '/');
		Route::middleware(['api', VerifyInternalSecret::class])->prefix("{$prefix}/internal")->group(function () {
			Route::get('auth/screen', [InternalScreenController::class, 'showByCode']);
			Route::get('venue/screens', [InternalScreenController::class, 'listByVendor']);
			Route::post('venue/screens', [InternalScreenController::class, 'register']);
			Route::post('venue/screens/batch', [InternalScreenController::class, 'registerBatch']);
			Route::get('venue/screens/config', [InternalScreenController::class, 'configByCode']);
			Route::post('venue/screens/heartbeat', [InternalScreenController::class, 'heartbeat']);
		});
	}
}
