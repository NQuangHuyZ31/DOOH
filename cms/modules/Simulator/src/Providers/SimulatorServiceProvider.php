<?php

namespace Modules\Simulator\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Simulator\Repositories\Interfaces\SimulatorScreenRepositoryInterface;
use Modules\Simulator\Repositories\SimulatorScreenRepository;

class SimulatorServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$configPath = dirname(__DIR__, 2) . '/configs/simulator.php';
		if (file_exists($configPath)) {
			$this->mergeConfigFrom($configPath, 'simulator');
		}

		$this->app->bind(SimulatorScreenRepositoryInterface::class, SimulatorScreenRepository::class);
	}

	public function boot(): void {}
}
