<?php

namespace Modules\Creative\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Creative\Repositories\CreativeRepository;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$this->app->bind(CreativeRepositoryInterface::class, CreativeRepository::class);
	}

	public function boot(): void
	{
		$migrationPath = dirname(__DIR__, 2) . '/database/migrations';
		if (is_dir($migrationPath)) {
			$this->loadMigrationsFrom($migrationPath);
		}
	}
}
