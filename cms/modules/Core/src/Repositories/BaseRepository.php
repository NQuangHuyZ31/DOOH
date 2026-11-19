<?php

namespace Modules\Core\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

abstract class BaseRepository implements BaseRepositoryInterface
{
    protected Model $model;

    /**
     * Default relations to eager-load.
     */
    protected array $with = [];

    /**
     * Default relation counts to eager-load.
     */
    protected array $withCount = [];

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * @param string[] $columns
     */
    public function all(array $columns = ['*'], array $filters = []): Collection
    {
        $query = $this->newQuery();

        if (!empty($filters) && method_exists($this->model, 'scopeFilter')) {
            $query->filter($filters);
        }

        return $query->get($columns);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function paginate(int $perPage = 15, array $filters = [], array $columns = ['*']): LengthAwarePaginator
    {
        $query = $this->newQuery();

        if (!empty($filters) && method_exists($this->model, 'scopeFilter')) {
            $query->filter($filters);
        }

        return $query->orderByDesc($this->model->getKeyName())->paginate($perPage, $columns);
    }

    /**
     * @param string[] $columns
     */
    public function find(int|string $id, array $columns = ['*']): ?Model
    {
        return $this->newQuery()->find($id, $columns);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(int|string $id, array $data): bool
    {
        $record = $this->find($id);
        return $record ? $record->update($data) : false;
    }

    public function delete(int|string $id): bool
    {
        $record = $this->find($id);
        return $record ? (bool) $record->delete() : false;
    }

    public function getModel(): Model
    {
        return $this->model;
    }

    protected function newQuery(): Builder
    {
        $query = $this->model->newQuery();

        if (method_exists($this->model, 'scopeForOwner')) {
            $query->forOwner();
        }

        if (!empty($this->with)) {
            $query->with($this->with);
        }

        if (!empty($this->withCount)) {
            $query->withCount($this->withCount);
        }

        return $query;
    }
}
