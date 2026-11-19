<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;
use Modules\Core\Traits\HasOwner;
use Modules\User\Models\User;

class Venue extends Model
{
    use Filterable, HasOwner, SoftDeletes;

    protected $table = 'venues';

    protected string $ownerColumn = 'media_owner_id';

    protected $fillable = [
        'code',
        'name',
        'venue_type',
        'media_owner_id',
        'address',
        'ward',
        'district',
        'city_province',
        'country_code',
        'latitude',
        'longitude',
        'opening_time',
        'closing_time',
        'is_24_7',
        'daily_traffic',
        'contact_name',
        'contact_phone',
        'status',
    ];

    protected array $filterable = [
        'search' => ['code', 'name', 'address', 'district', 'city_province'],
        'venue_type' => '=',
        'city_province' => '=',
        'media_owner_id' => '=',
        'status' => '=',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_24_7' => 'boolean',
        'daily_traffic' => 'integer',
        'deleted_at' => 'datetime',
    ];

    public function screens(): HasMany
    {
        return $this->hasMany(Screen::class);
    }

    public function mediaOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'media_owner_id');
    }
}
