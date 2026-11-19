<?php

namespace Modules\Venue\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;
use Modules\Core\Traits\HasOwner;

class Screen extends Model
{
    use Filterable, HasOwner, SoftDeletes;

    protected $table = 'screens';

    protected ?string $ownerColumn = null;

    protected string $ownerRelation = 'venue';

    protected $fillable = [
        'venue_id',
        'code',
        'name',
        'sub_location',
        'screen_type',
        'resolution_width',
        'resolution_height',
        'orientation',
        'aspect_ratio',
        'physical_width_m',
        'physical_height_m',
        'pixel_pitch_mm',
        'brightness_nits',
        'has_audio',
        'loop_duration_seconds',
        'default_slot_seconds',
        'hardware_device_uid',
        'secret_key',
        'connectivity_status',
        'last_heartbeat_at',
        'player_app_version',
        'ip_address',
        'storage_free_mb',
        'status',
    ];

    protected array $filterable = [
        'search' => ['code', 'name', 'sub_location', 'hardware_device_uid'],
        'venue_id' => '=',
        'screen_type' => '=',
        'orientation' => '=',
        'connectivity_status' => '=',
        'status' => '=',
    ];

    protected $casts = [
        'resolution_width' => 'integer',
        'resolution_height' => 'integer',
        'physical_width_m' => 'float',
        'physical_height_m' => 'float',
        'pixel_pitch_mm' => 'float',
        'brightness_nits' => 'integer',
        'has_audio' => 'boolean',
        'loop_duration_seconds' => 'integer',
        'default_slot_seconds' => 'integer',
        'storage_free_mb' => 'integer',
        'last_heartbeat_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(ScreenGroup::class, 'screen_group_items');
    }
}
