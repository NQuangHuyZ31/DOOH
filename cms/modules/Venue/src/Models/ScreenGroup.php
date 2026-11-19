<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ScreenGroup extends Model
{
    protected $table = 'screen_groups';

    protected $fillable = [
        'code',
        'name',
        'description',
        'status',
    ];

    public function screens(): BelongsToMany
    {
        return $this->belongsToMany(Screen::class, 'screen_group_items');
    }
}
