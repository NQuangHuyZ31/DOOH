<?php

namespace Modules\Vendor\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Core\Support\HmacKeyUtil;
use Modules\User\Services\UserService;
use Modules\Vendor\Models\Vendor;
use Modules\Vendor\Repositories\Interfaces\VendorRepositoryInterface;

class VendorService
{
	public function __construct(
		protected VendorRepositoryInterface $vendorRepo,
		protected UserService $userService
	) {}

	public function listVendors(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->vendorRepo->paginate($perPage, $filters);
	}

	public function getVendor(int|string $id): ?Vendor
	{
		return $this->vendorRepo->find($id);
	}

	public function getVendorByApiKeyHash(string $hash): ?Vendor
	{
		return $this->vendorRepo->findByApiKeyHash(strtolower(trim($hash)));
	}

	public function createVendor(array $data): array
	{
		return DB::transaction(function () use ($data) {
			if (!empty($data['create_user'])) {
				$user = $this->userService->createUser([
					'name' => $data['user_name'] ?? ($data['contact_name'] ?? $data['name']),
					'email' => $data['user_email'] ?? $data['contact_email'],
					'password' => $data['user_password'],
					'role_id' => 'media_owner',
					'permission_type' => 'role',
				]);
				$data['user_id'] = $user->id;
			}

			if (empty($data['code'])) {
				$data['code'] = $this->generateUniqueVendorCode($data['name'] ?? 'Vendor');
			} else {
				$data['code'] = strtoupper(trim($data['code']));
			}

			$keyData = $this->generateApiKey();
			$data['api_key_hash'] = $keyData['hash'];
			$data['api_key_prefix'] = $keyData['prefix'];

			unset($data['create_user'], $data['user_name'], $data['user_email'], $data['user_password']);

			$vendor = $this->vendorRepo->create($data);

			return [
				'vendor' => $vendor,
				'plain_api_key' => $keyData['plain_key'],
			];
		});
	}

	public function updateVendor(int|string $id, array $data): ?Vendor
	{
		return DB::transaction(function () use ($id, $data) {
			$existing = $this->getVendor($id);
			if (!$existing) {
				return null;
			}

			if (!empty($code = $data['code'] ?? null)) {
				$data['code'] = strtoupper(trim($code));
			}

			// Prevent overriding apiKey or altering user linkage through regular update
			unset($data['api_key_hash'], $data['api_key_prefix'], $data['user_id'], $data['create_user'], $data['user_name'], $data['user_email'], $data['user_password']);

			$this->vendorRepo->update($id, $data);

			// Bidirectional sync to linked User if contact name is updated
			if ($existing->user_id && !empty($data['contact_name'])) {
				$this->userService->updateUser((int) $existing->user_id, ['name' => $data['contact_name']]);
			}

			return $this->getVendor($id);
		});
	}

	public function deleteVendor(int|string $id): bool
	{
		$this->vendorRepo->update($id, ['user_id' => null]);

		return $this->vendorRepo->delete($id);
	}

	public function regenerateApiKey(int|string $id): ?array
	{
		$vendor = $this->getVendor($id);
		if (!$vendor) {
			return null;
		}

		$keyData = $this->generateApiKey();
		$this->vendorRepo->update($id, [
			'api_key_hash' => $keyData['hash'],
			'api_key_prefix' => $keyData['prefix'],
		]);

		return [
			'vendor' => $this->getVendor($id),
			'plain_api_key' => $keyData['plain_key'],
		];
	}

	protected function generateApiKey(): array
	{
		$prefix = config('vendor.api_key_prefix', 'dooh_live_');

		return HmacKeyUtil::generatePrefixedKey($prefix);
	}

	protected function generateUniqueVendorCode(string $name): string
	{
		$cleanSlug = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 8));
		if (empty($cleanSlug)) {
			$cleanSlug = 'VND';
		}

		$candidate = 'VND-' . $cleanSlug;
		if (!$this->vendorRepo->findByCode($candidate)) {
			return $candidate;
		}

		return 'VND-' . $cleanSlug . '-' . strtoupper(Str::random(4));
	}
}
