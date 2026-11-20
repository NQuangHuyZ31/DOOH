<?php

namespace Modules\Creative\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Creative\Models\Creative;

interface CreativeRepositoryInterface
{
	public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

	public function findById(int $id): ?Creative;

	public function create(array $data): Creative;

	public function update(int $id, array $data): ?Creative;

	public function delete(int $id): bool;

	public function updateStatus(int $id, string $status, ?string $rejectionReason = null, ?int $approverId = null): ?Creative;
}
