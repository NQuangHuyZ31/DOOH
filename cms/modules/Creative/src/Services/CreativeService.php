<?php

namespace Modules\Creative\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Core\Support\DisplaySpecHelper;
use Modules\Creative\Events\CreativeChanged;
use Modules\Creative\Models\Creative;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeService
{
	public function __construct(
		protected CreativeRepositoryInterface $creativeRepository,
		protected VastParserService $vastParserService,
		protected Html5PackageService $html5PackageService
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

		$data = $this->enrichCreativeSpecs($data);

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

		$data = $this->enrichCreativeSpecs($data, $existing);

		$updated = $this->creativeRepository->update($id, $data);
		if ($updated) {
			CreativeChanged::dispatch([(int) $id]);
		}

		return $updated ? $this->getCreativeById($id) : null;
	}

	protected function enrichCreativeSpecs(array $data, ?Creative $existing = null): array
	{
		$type = $data['type'] ?? $existing?->type ?? '';
		$mediaUrl = $data['media_url'] ?? $existing?->media_url ?? '';

		if ($type === 'vast' && !empty($mediaUrl)) {
			try {
				$parsedVast = $this->vastParserService->parse($mediaUrl);
				$data['metadata'] = array_merge($existing?->metadata ?? [], $data['metadata'] ?? [], ['vast' => $parsedVast]);
				if (!empty($parsedVast['has_ad'])) {
					if (empty($data['duration_seconds']) && !empty($parsedVast['duration_seconds'])) {
						$data['duration_seconds'] = $parsedVast['duration_seconds'];
					}
					if ((empty($data['width']) || empty($data['height'])) && !empty($parsedVast['width']) && !empty($parsedVast['height'])) {
						$data['width'] = $parsedVast['width'];
						$data['height'] = $parsedVast['height'];
						$data['aspect_ratio'] = $parsedVast['aspect_ratio'];
					}
				}
			} catch (\Exception $e) {
				if ($e instanceof \DomainException) {
					throw $e;
				}
			}
		}

		if ($type === 'html5' && !empty($mediaUrl) && $mediaUrl !== ($existing?->media_url ?? '')) {
			$prepared = $this->html5PackageService->preparePackage($mediaUrl);
			$oldExtractedDir = $existing?->metadata['html5']['extracted_dir'] ?? null;
			if ($oldExtractedDir && $oldExtractedDir !== ($prepared['extracted_dir'] ?? null)) {
				$this->html5PackageService->deletePackage($oldExtractedDir);
			}
			$data['media_url'] = $prepared['entry_url'];
			$data['metadata'] = array_merge($existing?->metadata ?? [], $data['metadata'] ?? [], ['html5' => $prepared]);
		}

		$width = (int) ($data['width'] ?? $existing?->width ?? 0);
		$height = (int) ($data['height'] ?? $existing?->height ?? 0);
		if ($width > 0 && $height > 0 && empty($data['aspect_ratio'])) {
			$data['aspect_ratio'] = DisplaySpecHelper::deriveAspectRatio($width, $height);
		}

		return $data;
	}

	public function deleteCreative(int|string $id): bool
	{
		$existing = $this->getCreativeById($id);
		$deleted = $this->creativeRepository->delete($id);
		if ($deleted) {
			$this->html5PackageService->deletePackage($existing?->metadata['html5']['extracted_dir'] ?? null);
			CreativeChanged::dispatch([(int) $id]);
		}

		return $deleted;
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

		$reviewed = $this->creativeRepository->updateStatus($id, $status, $rejectionReason, $approverId);
		if ($reviewed) {
			CreativeChanged::dispatch([(int) $id]);
		}

		return $reviewed;
	}

	public function batchReview(array $ids, string $status, ?string $rejectionReason = null, ?int $approverId = null): int
	{
		$count = $this->creativeRepository->batchUpdateStatus($ids, $status, $rejectionReason, $approverId);
		if ($count > 0) {
			CreativeChanged::dispatch(array_map('intval', $ids));
		}

		return $count;
	}

	public function parseVast(string $urlOrXml): array
	{
		return $this->vastParserService->parse($urlOrXml);
	}
}
