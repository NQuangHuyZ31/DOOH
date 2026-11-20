<?php

namespace Modules\Creative\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Core\Support\DisplaySpecHelper;
use Modules\Creative\Models\Creative;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeService
{
	public function __construct(
		protected CreativeRepositoryInterface $creativeRepository
	) {}

	public function listCreatives(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		return $this->creativeRepository->paginate($perPage, $filters);
	}

	public function getCreativeById(int|string $id): ?Creative
	{
		return $this->creativeRepository->find($id);
	}

	public function createCreative(array $data, ?int $userId = null, bool $canReview = false): Creative
	{
		$data['user_id'] = $userId ?? ($data['user_id'] ?? null);
		if (empty($data['code'])) {
			$data['code'] = 'CR-' . strtoupper(Str::random(8));
		}

		if (empty($data['aspect_ratio']) && !empty($data['width']) && !empty($data['height'])) {
			$data['aspect_ratio'] = DisplaySpecHelper::deriveAspectRatio((int) $data['width'], (int) $data['height']);
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

	public function updateCreative(int|string $id, array $data, ?int $userId = null, bool $canReview = false): ?Creative
	{
		$existing = $this->getCreativeById($id);
		if (!$existing) {
			return null;
		}

		$isMediaChanged = !empty($data['media_url']) && $data['media_url'] !== $existing->media_url;

		if ($isMediaChanged) {
			if ($canReview) {
				if (($data['status'] ?? $existing->status) === 'approved') {
					$data['status'] = 'approved';
					$data['approved_by'] = $userId;
					$data['approved_at'] = now();
					$data['rejection_reason'] = null;
				}
			} else {
				$data['status'] = 'pending_review';
				$data['approved_by'] = null;
				$data['approved_at'] = null;
				$data['rejection_reason'] = null;
			}
		} elseif ($existing->status === 'approved') {
			$data['status'] = 'approved';
		}

		if (!empty($data['width']) && !empty($data['height'])) {
			$data['aspect_ratio'] = DisplaySpecHelper::deriveAspectRatio((int) $data['width'], (int) $data['height']);
		}

		$updated = $this->creativeRepository->update($id, $data);
		return $updated ? $this->getCreativeById($id) : null;
	}

	public function deleteCreative(int|string $id): bool
	{
		return $this->creativeRepository->delete($id);
	}

	public function reviewCreative(int|string $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative
	{
		$existing = $this->getCreativeById($id);
		if (!$existing) {
			return null;
		}

		if ($existing->status === 'approved') {
			throw new \DomainException('Approved creatives cannot have their status changed.');
		}

		return $this->creativeRepository->updateStatus($id, $status, $rejectionReason, $approverId);
	}

	public function batchReview(array $ids, string $status, ?string $rejectionReason = null, ?int $approverId = null): int
	{
		return $this->creativeRepository->batchUpdateStatus($ids, $status, $rejectionReason, $approverId);
	}
}
