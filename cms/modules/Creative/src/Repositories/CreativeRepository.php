<?php

namespace Modules\Creative\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Creative\Models\Creative;
use Modules\Creative\Repositories\Interfaces\CreativeRepositoryInterface;

class CreativeRepository extends BaseRepository implements CreativeRepositoryInterface
{
	protected array $with = ['creator', 'approver'];

	public function __construct(Creative $model)
	{
		parent::__construct($model);
	}

	public function batchUpdateStatus(array $ids, string $status, ?string $rejectionReason = null, ?int $approverId = null): int
	{
		$data = [
			'status' => $status,
			'approved_by' => $approverId,
			'approved_at' => now(),
		];
		if ($status === 'approved') {
			$data['rejection_reason'] = null;
		} elseif ($status === 'rejected') {
			$data['rejection_reason'] = $rejectionReason;
		}

		return $this->newQuery()
			->whereIn('id', $ids)
			->where('status', '!=', 'approved')
			->update($data);
	}

	public function updateStatus(int|string $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative
	{
		$updated = $this->batchUpdateStatus([(int) $id], $status, $rejectionReason, $approverId);

		return $updated > 0 ? $this->find($id) : null;
	}
}
