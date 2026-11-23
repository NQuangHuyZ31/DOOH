<?php

namespace Modules\Delivery\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Delivery\Repositories\CampaignRepository;
use Modules\Delivery\Repositories\Interfaces\CampaignRepositoryInterface;
use Modules\Delivery\Repositories\Interfaces\LineItemRepositoryInterface;
use Modules\Delivery\Repositories\LineItemRepository;

class DeliveryServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$this->app->bind(CampaignRepositoryInterface::class, CampaignRepository::class);
		$this->app->bind(LineItemRepositoryInterface::class, LineItemRepository::class);
	}

	public function boot(): void
	{
		$migrationPath = dirname(__DIR__, 2) . '/database/migrations';
		if (is_dir($migrationPath)) {
			$this->loadMigrationsFrom($migrationPath);
		}
	}
}
