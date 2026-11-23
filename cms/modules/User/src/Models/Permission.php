<?php

namespace Modules\User\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Core\Traits\Filterable;

class Permission extends Model
{
    use HasFactory, Filterable;

    protected $table = 'permissions';

    protected $fillable = [
        'name',
        'module',
        'display_name',
        'description',
    ];

    protected array $filterable = [
        'search' => ['name', 'display_name', 'description'],
        'module',
        'name',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'permission_id', 'role_id');
    }

    public function directUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions', 'permission_id', 'user_id');
    }
}
