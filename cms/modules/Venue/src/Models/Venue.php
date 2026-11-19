<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;

class Venue extends Model
{
    use Filterable, SoftDeletes;

    protected $table = 'venues';

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
}
