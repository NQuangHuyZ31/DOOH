<?php

namespace Modules\User\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    /**
     * Columns & relationships enabled for dynamic filtering.
     */
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

    /**
     * Single assigned role (BelongsTo).
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Direct module permissions when permission_type === 'direct'.
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'user_permissions',
            'user_id',
            'permission_id'
        );
    }

    /**
     * Check if authorization is based on Role.
     */
    public function isRoleMode(): bool
    {
        return $this->permission_type === self::PERMISSION_TYPE_ROLE;
    }

    /**
     * Check if authorization is based on Direct Module Permissions.
     */
    public function isDirectMode(): bool
    {
        return $this->permission_type === self::PERMISSION_TYPE_DIRECT;
    }

    /**
     * Check if user has given role(s).
     */
    public function hasRole(string|array $roles): bool
    {
        if (!$this->isRoleMode() || !$this->role) {
            return false;
        }

        $roleList = is_array($roles) ? $roles : [$roles];
        return in_array($this->role->name, $roleList, true);
    }

    /**
     * Check if user has given permission (either via Role or Direct, mutually exclusive).
     */
    public function hasPermission(string $permission): bool
    {
        // 1. Super Admin role always has all permissions
        if ($this->hasRole('super_admin')) {
            return true;
        }

        // 2. Direct module permission mode
        if ($this->isDirectMode()) {
            return $this->directPermissions()
                ->where('name', $permission)
                ->exists();
        }

        // 3. Role-based permission mode
        if ($this->isRoleMode() && $this->role) {
            return $this->role->permissions()
                ->where('name', $permission)
                ->exists();
        }

        return false;
    }

    /**
     * Get the single role name.
     */
    public function getRoleName(): ?string
    {
        return $this->isRoleMode() ? $this->role?->name : null;
    }

    /**
     * Get role names as array (single element or empty).
     *
     * @return string[]
     */
    public function getRoleNames(): array
    {
        $roleName = $this->getRoleName();
        return $roleName !== null ? [$roleName] : [];
    }

    /**
     * Get all active permission names for the user.
     *
     * @return string[]
     */
    public function getAllPermissions(): array
    {
        if ($this->hasRole('super_admin')) {
            return Permission::pluck('name')->all();
        }

        if ($this->isDirectMode()) {
            return $this->directPermissions
                ->pluck('name')
                ->values()
                ->all();
        }

        if ($this->isRoleMode() && $this->role) {
            return $this->role->permissions
                ->pluck('name')
                ->values()
                ->all();
        }

        return [];
    }
}
