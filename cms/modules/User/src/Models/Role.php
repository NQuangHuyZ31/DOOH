<?php

namespace Modules\User\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Core\Traits\Filterable;

class Role extends Model
{
    use HasFactory, Filterable;

    protected $table = 'roles';

    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    protected array $filterable = [
        'search' => ['name', 'display_name', 'description'],
        'name',
        'display_name',
    ];

    /**
     * The permissions that belong to the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        );
    }

    /**
     * The users that belong to the role (One Role to Many Users).
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
