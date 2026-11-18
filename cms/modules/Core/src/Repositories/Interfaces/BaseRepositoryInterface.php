<?php

namespace Modules\Core\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface BaseRepositoryInterface
{
    /**
     * @param string[] $columns
     */
    public function all(array $columns = ['*'], array $filters = []): Collection;

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(int $perPage = 15, array $filters = [], array $columns = ['*']): LengthAwarePaginator;

    /**
     * @param string[] $columns
     */
    public function find(int|string $id, array $columns = ['*']): ?Model;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Model;

    /**
     * @param array<string, mixed> $data
     */
    public function update(int|string $id, array $data): bool;

    public function delete(int|string $id): bool;
}
