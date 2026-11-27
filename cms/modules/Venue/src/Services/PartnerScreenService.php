<?php

namespace Modules\Venue\Services;

use DomainException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Validator;
use Modules\Venue\Http\Requests\RegisterPartnerScreenRequest;
use Modules\Venue\Models\Screen;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;

class PartnerScreenService
{
	public function __construct(
		protected ScreenService $screenService,
		protected VenueService $venueService,
		protected ScreenRepositoryInterface $screenRepo,
		protected VenueRepositoryInterface $venueRepo
	) {}

	public function registerScreen(int $ownerId, array $payload): Screen
	{
		$hardwareUid = isset($payload['hardware_device_uid']) ? trim((string) $payload['hardware_device_uid']) : '';
		if ($hardwareUid !== '' && $this->screenRepo->findByOwnerAndHardwareUid($ownerId, $hardwareUid)) {
			throw new DomainException('hardware_device_uid already registered');
		}

		$locationName = trim((string) $payload['location_name']);
		$city = trim((string) $payload['city']);
		$venue = $this->venueRepo->findByOwnerAndLocation($ownerId, $locationName, $city);
		if (!$venue) {
			$is247 = (bool) ($payload['is_24_7'] ?? false);
			$venue = $this->venueService->createVenue([
				'name' => $locationName,
				'city_province' => $city,
				'media_owner_id' => $ownerId,
				'venue_type' => $payload['venue_type'] ?? 'commercial',
				'is_24_7' => $is247,
				'opening_time' => $is247 ? '00:00:00' : ($payload['opening_time'] ?? '06:00:00'),
				'closing_time' => $is247 ? '23:59:59' : ($payload['closing_time'] ?? '23:00:00'),
				'status' => 'active',
			]);
		}

		$screen = $this->screenService->createScreen([
			'venue_id' => $venue->id,
			'name' => trim((string) $payload['name']),
			'sub_location' => isset($payload['sub_location']) ? trim((string) $payload['sub_location']) : null,
			'screen_type' => $payload['screen_type'] ?? 'led',
			'resolution_width' => (int) $payload['resolution_width'],
			'resolution_height' => (int) $payload['resolution_height'],
			'has_audio' => (bool) ($payload['has_audio'] ?? false),
			'loop_duration_seconds' => (int) ($payload['loop_duration_seconds'] ?? 120),
			'default_slot_seconds' => (int) ($payload['default_slot_seconds'] ?? 15),
			'hardware_device_uid' => $hardwareUid !== '' ? $hardwareUid : null,
			'status' => 'active',
		]);

		return $this->screenService->getScreenByCode($screen->code) ?? $screen;
	}

	public function registerScreensBatch(int $ownerId, array $screens): array
	{
		$created = [];
		$failed = [];
		$rules = RegisterPartnerScreenRequest::screenRules();

		foreach ($screens as $index => $item) {
			if (!is_array($item)) {
				$failed[] = ['index' => $index, 'hardware_device_uid' => null, 'name' => null, 'error' => 'Invalid screen item payload'];
				continue;
			}

			$validator = Validator::make($item, $rules);
			if ($validator->fails()) {
				$failed[] = [
					'index' => $index,
					'hardware_device_uid' => $item['hardware_device_uid'] ?? null,
					'name' => $item['name'] ?? null,
					'error' => $validator->errors()->first(),
				];
				continue;
			}

			try {
				$created[] = ['index' => $index, 'screen' => $this->registerScreen($ownerId, $validator->validated())];
			} catch (DomainException $e) {
				$failed[] = [
					'index' => $index,
					'hardware_device_uid' => $item['hardware_device_uid'] ?? null,
					'name' => $item['name'] ?? null,
					'error' => $e->getMessage(),
				];
			}
		}

		return [
			'total' => count($screens),
			'created_count' => count($created),
			'failed_count' => count($failed),
			'created' => $created,
			'failed' => $failed,
		];
	}

	public function listScreens(int $ownerId): Collection
	{
		return $this->screenRepo->getByMediaOwner($ownerId);
	}

	public function recordHeartbeat(string $code, array $payload): ?Screen
	{
		$screen = $this->screenService->getScreenByCode($code);
		if (!$screen) {
			return null;
		}

		$update = [
			'connectivity_status' => 'online',
			'last_heartbeat_at' => now(),
		];
		if (!empty($payload['player_app_version'])) {
			$update['player_app_version'] = trim((string) $payload['player_app_version']);
		}
		if (!empty($payload['ip_address'])) {
			$update['ip_address'] = trim((string) $payload['ip_address']);
		}
		if (isset($payload['storage_free_mb']) && is_numeric($payload['storage_free_mb'])) {
			$update['storage_free_mb'] = max(0, (int) $payload['storage_free_mb']);
		}

		$this->screenRepo->update($screen->id, $update);

		return $this->screenService->getScreenByCode($code);
	}
}
