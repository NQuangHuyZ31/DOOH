<?php

namespace Modules\User\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Core\Traits\Filterable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, Filterable, SoftDeletes;

    public const PERMISSION_TYPE_ROLE = 'role';
    public const PERMISSION_TYPE_DIRECT = 'direct';

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'permission_type',
    ];

    protected array $filterable = [
        'search' => ['name', 'email'],
        'role' => 'role.name',
        'permission_type' => '=',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function vendor(): HasOne
    {
        return $this->hasOne(\Modules\Vendor\Models\Vendor::class, 'user_id');
    }

    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions', 'user_id', 'permission_id');
    }

    public function isRoleMode(): bool
    {
        return $this->permission_type === self::PERMISSION_TYPE_ROLE;
    }

    public function isDirectMode(): bool
    {
        return $this->permission_type === self::PERMISSION_TYPE_DIRECT;
    }

    public function hasRole(string|array $roles): bool
    {
        if (!$this->isRoleMode() || !$this->role) {
            return false;
        }

        $roleList = is_array($roles) ? $roles : [$roles];
        return in_array($this->role->name, $roleList, true);
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->hasRole('super_admin')) {
            return true;
        }

        if ($this->isDirectMode()) {
            return $this->directPermissions()->where('name', $permission)->exists();
        }

        if ($this->isRoleMode() && $this->role) {
            return $this->role->permissions()->where('name', $permission)->exists();
        }

        return false;
    }

    public function getRoleName(): ?string
    {
        return $this->isRoleMode() ? $this->role?->name : null;
    }

    public function getRoleNames(): array
    {
        $roleName = $this->getRoleName();
        return $roleName !== null ? [$roleName] : [];
    }

    public function getAllPermissions(): array
    {
        if ($this->isDirectMode()) {
            return $this->directPermissions->pluck('name')->values()->all();
        }

        if ($this->role) {
            return $this->role->permissions->pluck('name')->values()->all();
        }

        return $this->hasRole('super_admin') ? ['*'] : [];
    }
}
