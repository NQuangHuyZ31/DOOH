<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

trait Filterable
{
    /**
     * Scope a query to apply dynamic filters.
     */
    public function scopeFilter(Builder $query, array $filters = []): Builder
    {
        if (empty($filters)) {
            return $query;
        }

        $filterable = $this->getFilterableMap();

        foreach ($filters as $key => $value) {
            if ($this->shouldSkipFilterValue($value)) {
                continue;
            }

            // 1. Check custom filter method on model: filterBy<StudlyKey> or filter<StudlyKey>
            $method = 'filterBy' . Str::studly((string) $key);
            if (method_exists($this, $method)) {
                $this->{$method}($query, $value, $key);
                continue;
            }

            $shortMethod = 'filter' . Str::studly((string) $key);
            if (method_exists($this, $shortMethod)) {
                $this->{$shortMethod}($query, $value, $key);
                continue;
            }

            // 2. If key not in filterable map, skip it
            if (!array_key_exists($key, $filterable)) {
                continue;
            }

            $rule = $filterable[$key];

            $this->applyFilterRule($query, (string) $key, $value, $rule);
        }

        return $query;
    }

    /**
     * Get the defined filterable columns and rules.
     */
    public function getFilterableMap(): array
    {
        if (property_exists($this, 'filterable') && is_array($this->filterable)) {
            $map = [];
            foreach ($this->filterable as $k => $v) {
                if (is_int($k)) {
                    $map[$v] = '=';
                } else {
                    $map[$k] = $v;
                }
            }
            return $map;
        }

        return [];
    }

    /**
     * Apply a specific filter rule.
     */
    protected function applyFilterRule(Builder $query, string $key, mixed $value, mixed $rule): void
    {
        // Callable rule: fn ($query, $value, $key) => ...
        if (is_callable($rule) && !is_string($rule)) {
            $rule($query, $value, $key);
            return;
        }

        // Array of columns: multi-column LIKE search, e.g. 'search' => ['name', 'email']
        if (is_array($rule)) {
            $query->where(function (Builder $nestedQuery) use ($rule, $value) {
                foreach ($rule as $column) {
                    if (str_contains($column, '.')) {
                        [$relation, $relCol] = explode('.', $column, 2);
                        $nestedQuery->orWhereHas($relation, function (Builder $relQ) use ($relCol, $value) {
                            $relQ->where($relCol, 'like', "%{$value}%");
                        });
                    } else {
                        $nestedQuery->orWhere($column, 'like', "%{$value}%");
                    }
                }
            });
            return;
        }

        // Relationship dot notation in rule e.g. 'role' => 'role.name'
        if (is_string($rule) && str_contains($rule, '.')) {
            [$relation, $relationColumn] = explode('.', $rule, 2);
            $query->whereHas($relation, function (Builder $q) use ($relationColumn, $value) {
                if (is_array($value)) {
                    $q->whereIn($relationColumn, $value);
                } else {
                    $q->where($relationColumn, '=', $value);
                }
            });
            return;
        }

        // Handle string rules
        $column = $key;
        $operator = is_string($rule) ? strtolower(trim($rule)) : '=';

        // Check operator with target column e.g. '>=:created_at' or 'like:name'
        if (str_contains($operator, ':')) {
            [$operator, $column] = explode(':', $operator, 2);
            $operator = strtolower(trim($operator));
            $column = trim($column);
        }

        switch ($operator) {
            case 'like':
            case '%like%':
                $query->where($column, 'like', "%{$value}%");
                break;

            case 'like%':
            case 'starts_with':
                $query->where($column, 'like', "{$value}%");
                break;

            case '%like':
            case 'ends_with':
                $query->where($column, 'like', "%{$value}");
                break;

            case 'in':
                $query->whereIn($column, (array) $value);
                break;

            case 'not_in':
                $query->whereNotIn($column, (array) $value);
                break;

            case 'date':
                $query->whereDate($column, $value);
                break;

            case 'year':
                $query->whereYear($column, $value);
                break;

            case 'month':
                $query->whereMonth($column, $value);
                break;

            case 'null':
                if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                    $query->whereNull($column);
                } else {
                    $query->whereNotNull($column);
                }
                break;

            case 'not_null':
                $query->whereNotNull($column);
                break;

            case '>':
            case '>=':
            case '<':
            case '<=':
            case '!=':
            case '<>':
                $query->where($column, $operator, $value);
                break;

            case '=':
            case 'exact':
            default:
                if (is_array($value)) {
                    $query->whereIn($column, $value);
                } else {
                    $query->where($column, '=', $value);
                }
                break;
        }
    }

    /**
     * Determine if a filter value should be skipped.
     */
    protected function shouldSkipFilterValue(mixed $value): bool
    {
        return $value === null || $value === '' || $value === [];
    }
}
