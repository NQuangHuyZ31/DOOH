<?php

namespace Modules\Vendor\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Modules\Core\Support\HmacKeyUtil;
use Modules\Vendor\Models\Vendor;
use Modules\Vendor\Repositories\Interfaces\VendorRepositoryInterface;

class VendorService
{
	public function __construct(
		protected VendorRepositoryInterface $vendorRepo
	) {}

	public function listVendors(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->vendorRepo->paginate($perPage, $filters);
	}

	public function getVendor(int|string $id): ?Vendor
	{
		return $this->vendorRepo->find($id);
	}

	public function createVendor(array $data): array
	{
		if (empty($data['code'])) {
			$data['code'] = $this->generateUniqueVendorCode($data['name'] ?? 'Vendor');
		} else {
			$data['code'] = strtoupper(trim($data['code']));
		}

		$keyData = $this->generateApiKey();
		$data['api_key_hash'] = $keyData['hash'];
		$data['api_key_prefix'] = $keyData['prefix'];

		$vendor = $this->vendorRepo->create($data);

		return [
			'vendor' => $vendor,
			'plain_api_key' => $keyData['plain_key'],
		];
	}

	public function updateVendor(int|string $id, array $data): ?Vendor
	{
		if (!empty($data['code'])) {
			$data['code'] = strtoupper(trim($data['code']));
		}

		// Prevent overriding apiKey through regular update
		unset($data['api_key_hash'], $data['api_key_prefix']);

		$updated = $this->vendorRepo->update($id, $data);

		return $updated ? $this->getVendor($id) : null;
	}

	public function deleteVendor(int|string $id): bool
	{
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

		return HmacKeyUtil::generatePartnerApiKey($prefix);
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
