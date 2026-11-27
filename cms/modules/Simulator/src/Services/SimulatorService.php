<?php

namespace Modules\Simulator\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Services\MetadataService;
use Modules\Core\Support\DisplaySpecHelper;
use Modules\Creative\Services\VastParserService;
use Modules\Simulator\Models\SimulatorScreen;
use Modules\Simulator\Repositories\Interfaces\SimulatorScreenRepositoryInterface;

class SimulatorService
{
	public function __construct(
		protected SimulatorScreenRepositoryInterface $simScreenRepo,
		protected VastParserService $vastParserService
	) {}

	public function listScreens(array $filters = [], int $perPage = 50): LengthAwarePaginator
	{
		return $this->simScreenRepo->paginate($perPage, $filters);
	}

	public function createLocalScreen(array $data): SimulatorScreen
	{
		$specs = DisplaySpecHelper::deriveSpecs((int) $data['resolution_width'], (int) $data['resolution_height']);
		$payload = array_merge($data, $specs, [
			'screen_type' => $data['screen_type'] ?? MetadataService::defaultEnumValue('screen_types', 'outdoor_led'),
			'sync_status' => 'unsynced',
		]);

		return $this->simScreenRepo->create($payload);
	}

	public function markScreenSynced(int|string $id, string $code, string $secretKey): ?SimulatorScreen
	{
		$simScreen = $this->simScreenRepo->find($id);
		if (!$simScreen) {
			return null;
		}

		$this->simScreenRepo->update($id, [
			'sync_status' => 'synced',
			'synced_code' => trim($code),
			'synced_secret_key' => trim($secretKey),
			'synced_at' => now(),
		]);

		return $this->simScreenRepo->find($id);
	}

	public function markScreensBatchSynced(array $items): array
	{
		$synced = [];
		foreach ($items as $item) {
			$updated = $this->markScreenSynced($item['id'], $item['code'], $item['secret_key']);
			if ($updated) {
				$synced[] = $updated;
			}
		}

		return $synced;
	}

	public function deleteLocalScreen(int|string $id): bool
	{
		return $this->simScreenRepo->delete($id);
	}

	public function parseVastTag(string $vastUrl): array
	{
		return $this->vastParserService->parse($vastUrl);
	}
}
