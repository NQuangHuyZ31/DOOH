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
		Route::middleware(['api', VerifyInternalSecret::class])
			->get("{$prefix}/internal/auth/screen", [InternalScreenController::class, 'showByCode']);
	}
}
