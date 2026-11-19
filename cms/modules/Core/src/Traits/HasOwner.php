<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait HasOwner
{
    // Automatically assign owner on model creation for non-admin users
    protected static function bootHasOwner(): void
    {
        static::creating(function (Model $model) {
            $user = static::resolveAuthUser();

            if ($user && method_exists($user, 'hasRole') && !$user->hasRole('super_admin') && !$user->hasRole('admin')) {
                $column = $model->getOwnerColumn();
                if ($column && empty($model->{$column})) {
                    $model->{$column} = $user->id;
                }
            }
        });
    }

    // Resolve currently authenticated user across request, sanctum, and web guards
    protected static function resolveAuthUser(mixed $user = null): mixed
    {
        if ($user) {
            return $user;
        }

        return request()?->user() ?? auth('sanctum')->user() ?? auth()->user();
    }

    // Direct ownership column on model, or null if relational
    public function getOwnerColumn(): ?string
    {
        return property_exists($this, 'ownerColumn') ? $this->ownerColumn : 'user_id';
    }

    // Relation through which ownership is resolved, or null if direct
    public function getOwnerRelation(): ?string
    {
        return property_exists($this, 'ownerRelation') ? $this->ownerRelation : null;
    }

    // Scope records accessible to authenticated or given user
    public function scopeForOwner(Builder $query, mixed $user = null): Builder
    {
        $user = static::resolveAuthUser($user);

        // If unauthenticated or user is super_admin/admin, allow unrestricted access
        if (!$user) {
            return $query;
        }

        if (method_exists($user, 'hasRole') && ($user->hasRole('super_admin') || $user->hasRole('admin'))) {
            return $query;
        }

        $userId = is_object($user) ? $user->id : (int) $user;

        // 1. Direct Ownership
        $column = $this->getOwnerColumn();
        if ($column !== null) {
            return $query->where($this->qualifyColumn($column), $userId);
        }

        // 2. Relational Ownership
        $relation = $this->getOwnerRelation();
        if ($relation !== null) {
            return $query->whereHas($relation, function (Builder $relQuery) use ($userId) {
                if (method_exists($relQuery->getModel(), 'getOwnerColumn')) {
                    $relColumn = $relQuery->getModel()->getOwnerColumn() ?: 'user_id';
                    $relQuery->where($relQuery->getModel()->qualifyColumn($relColumn), $userId);
                } else {
                    $relQuery->where('media_owner_id', $userId)->orWhere('user_id', $userId);
                }
            });
        }

        return $query;
    }
}
