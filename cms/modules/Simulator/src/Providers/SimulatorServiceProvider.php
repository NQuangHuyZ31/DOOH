<?php

namespace Modules\Simulator\Providers;

use Illuminate\Support\ServiceProvider;

class SimulatorServiceProvider extends ServiceProvider
{
	public function register(): void
	{
		$configPath = dirname(__DIR__, 2) . '/configs/simulator.php';
		if (file_exists($configPath)) {
			$this->mergeConfigFrom($configPath, 'simulator');
		}
	}

	public function boot(): void {}
}
