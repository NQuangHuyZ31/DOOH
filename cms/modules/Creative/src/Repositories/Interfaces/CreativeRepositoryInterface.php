<?php

namespace Modules\Creative\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Creative\Models\Creative;

interface CreativeRepositoryInterface extends BaseRepositoryInterface
{
	public function updateStatus(int|string $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative;

	public function batchUpdateStatus(array $ids, string $status, ?string $rejectionReason = null, ?int $approverId = null): int;
}

