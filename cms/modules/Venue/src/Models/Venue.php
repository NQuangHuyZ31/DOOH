<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
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

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
    ];
}
