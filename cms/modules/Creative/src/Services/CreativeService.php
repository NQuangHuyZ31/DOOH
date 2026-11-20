<?php

namespace Modules\Creative\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Creative\Models\Creative;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeService
{
	public function __construct(
		protected CreativeRepositoryInterface $creativeRepository
	) {}

	public function listCreatives(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->creativeRepository->paginate($filters, $perPage);
	}

	public function getCreativeById(int $id): ?Creative
	{
		return $this->creativeRepository->findById($id);
	}

	public function createCreative(array $data, ?int $userId = null, bool $canReview = false): Creative
	{
		$data['user_id'] = $userId ?? ($data['user_id'] ?? null);
		if (empty($data['code'])) {
			$data['code'] = 'CR-' . strtoupper(Str::random(8));
		}

		if (empty($data['aspect_ratio']) && !empty($data['width']) && !empty($data['height'])) {
			$data['aspect_ratio'] = $this->deriveAspectRatio((int) $data['width'], (int) $data['height']);
		}

		// Only reviewers (admin/operator) can set custom status or directly approve on creation
		if ($canReview && !empty($data['status'])) {
			if ($data['status'] === 'approved') {
				$data['approved_by'] = $userId;
				$data['approved_at'] = now();
			}
		} else {
			$data['status'] = 'pending_review';
			$data['approved_by'] = null;
			$data['approved_at'] = null;
		}

		$creative = $this->creativeRepository->create($data);
		return $creative->load(['creator', 'approver']);
	}

	public function createBatch(array $items, ?int $userId = null, bool $canReview = false): Collection
	{
		return DB::transaction(function () use ($items, $userId, $canReview) {
			$created = collect();
			foreach ($items as $item) {
				$created->push($this->createCreative($item, $userId, $canReview));
			}
			return $created;
		});
	}

	public function updateCreative(int $id, array $data): ?Creative
	{
		if (!empty($data['width']) && !empty($data['height'])) {
			$data['aspect_ratio'] = $this->deriveAspectRatio((int) $data['width'], (int) $data['height']);
		}

		return $this->creativeRepository->update($id, $data);
	}

	public function deleteCreative(int $id): bool
	{
		return $this->creativeRepository->delete($id);
	}

	public function reviewCreative(int $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative
	{
		return $this->creativeRepository->updateStatus($id, $status, $rejectionReason, $approverId);
	}

	public function deriveAspectRatio(int $width, int $height): string
	{
		if ($height === 0) {
			return 'custom';
		}

		$ratio = $width / $height;
		if (abs($ratio - (16 / 9)) < 0.05) {
			return '16:9';
		}
		if (abs($ratio - (9 / 16)) < 0.05) {
			return '9:16';
		}
		if (abs($ratio - (4 / 3)) < 0.05) {
			return '4:3';
		}

		return 'custom';
	}
}
