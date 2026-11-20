<?php

namespace Modules\Creative\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Creative\Models\Creative;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeRepository implements CreativeRepositoryInterface
{
	public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
	{
		$query = Creative::query()->with(['creator', 'approver']);

		if (!empty($filters['search'])) {
			$search = trim($filters['search']);
			$query->where(function ($q) use ($search) {
				$q->where('name', 'like', "%{$search}%")
					->orWhere('code', 'like', "%{$search}%");
			});
		}

		if (!empty($filters['type'])) {
			$query->where('type', $filters['type']);
		}

		if (!empty($filters['status'])) {
			$query->where('status', $filters['status']);
		}

		if (!empty($filters['aspect_ratio'])) {
			$query->where('aspect_ratio', $filters['aspect_ratio']);
		}

		return $query->latest('id')->paginate($perPage);
	}

	public function findById(int $id): ?Creative
	{
		return Creative::with(['creator', 'approver'])->find($id);
	}

	public function create(array $data): Creative
	{
		return Creative::create($data);
	}

	public function update(int $id, array $data): ?Creative
	{
		$creative = Creative::find($id);
		if (!$creative) {
			return null;
		}

		$creative->update($data);
		return $creative->fresh(['creator', 'approver']);
	}

	public function delete(int $id): bool
	{
		$creative = Creative::find($id);
		if (!$creative) {
			return false;
		}

		return (bool) $creative->delete();
	}

	public function updateStatus(int $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative
	{
		$creative = Creative::find($id);
		if (!$creative) {
			return null;
		}

		$payload = [
			'status' => $status,
			'approved_by' => $approverId,
			'approved_at' => now(),
		];
		if ($status === 'rejected') {
			$payload['rejection_reason'] = $rejectionReason;
		} else {
			$payload['rejection_reason'] = null;
		}

		$creative->update($payload);
		return $creative->fresh(['creator', 'approver']);
	}
}
