<?php

namespace Modules\Simulator\Services;

use Modules\Creative\Services\VastParserService;
use Modules\Venue\Resources\ScreenResource;
use Modules\Venue\Services\ScreenService;

class SimulatorService
{
	public function __construct(
		protected ScreenService $screenService,
		protected VastParserService $vastParserService
	) {}

	public function syncDeviceConfig(int|string $screenId): ?array
	{
		$screen = $this->screenService->getScreen($screenId);
		if (!$screen) {
			return null;
		}

		$baseUrl = rtrim((string) config('simulator.node_api_url', 'http://localhost:3000'), '/');
		$prefix = '/' . trim((string) config('simulator.node_api_prefix', '/api/v1'), '/');

		return [
			'node_api_url' => "{$baseUrl}{$prefix}",
			'screen' => (new ScreenResource($screen))->resolve(),
		];
	}

	public function parseVastTag(string $vastUrl): array
	{
		// Inject dynamic correlator to avoid GAM returning empty <VAST/>
		return $this->vastParserService->parse($this->injectCacheBuster($vastUrl));
	}

	protected function injectCacheBuster(string $url): string
	{
		$buster = (string) (now()->getTimestampMs() . random_int(100, 999));
		$replaced = str_ireplace(['[TIMESTAMP]', '[CORRELATOR]', '[CACHEBUSTING]', '{timestamp}'], $buster, $url);

		if (preg_match('/([?&]correlator=)(&|$)/i', $replaced)) {
			return (string) preg_replace('/([?&]correlator=)(&|$)/i', '$1' . $buster . '$2', $replaced);
		}

		return $replaced;
	}
}
