<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;

class Venue extends Model
{
    use Filterable, SoftDeletes;

    protected $table = 'venues';

    protected $fillable = [
        'code',
        'name',
        'location',
        'width',
        'height',
        'orientation',
        'secret_key',
        'status',
    ];

    /**
     * Columns & rules enabled for dynamic filtering.
     *
     * @var array<string, mixed>
     */
    protected array $filterable = [
        'search' => ['code', 'name', 'location'],
        'orientation' => '=',
        'status' => '=',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'deleted_at' => 'datetime',
    ];
}
