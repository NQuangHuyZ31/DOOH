<?php

namespace Modules\Vendor\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Modules\User\Events\UserDeleted;
use Modules\User\Events\UserSaved;
use Modules\Vendor\Listeners\SyncVendorUserListener;
use Modules\Vendor\Repositories\Interfaces\VendorRepositoryInterface;
use Modules\Vendor\Repositories\VendorRepository;

class VendorServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$configPath = dirname(__DIR__, 2) . '/configs/vendor.php';
		if (file_exists($configPath)) {
			$this->mergeConfigFrom($configPath, 'vendor');
		}

		$this->app->bind(VendorRepositoryInterface::class, VendorRepository::class);
	}

	public function boot(): void
	{
		Event::listen(UserSaved::class, [SyncVendorUserListener::class, 'handleSaved']);
		Event::listen(UserDeleted::class, [SyncVendorUserListener::class, 'handleDeleted']);
	}
}
