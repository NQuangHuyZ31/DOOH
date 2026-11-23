<?php

namespace Modules\Vendor\Providers;

use Illuminate\Support\ServiceProvider;
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
		//
	}
}
