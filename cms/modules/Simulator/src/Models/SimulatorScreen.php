<?php

namespace Modules\Simulator\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;

class SimulatorScreen extends Model
{
	use Filterable, SoftDeletes;

	protected $table = 'simulator_screens';

	protected $fillable = [
		'name',
		'location_name',
		'city',
		'sub_location',
		'screen_type',
		'resolution_width',
		'resolution_height',
		'orientation',
		'aspect_ratio',
		'has_audio',
		'loop_duration_seconds',
		'default_slot_seconds',
		'hardware_device_uid',
		'sync_status',
		'synced_code',
		'synced_secret_key',
		'synced_at',
	];

	protected array $filterable = [
		'search' => ['name', 'location_name', 'city', 'synced_code', 'hardware_device_uid'],
		'sync_status' => '=',
	];

	protected $casts = [
		'resolution_width' => 'integer',
		'resolution_height' => 'integer',
		'has_audio' => 'boolean',
		'loop_duration_seconds' => 'integer',
		'default_slot_seconds' => 'integer',
		'synced_at' => 'datetime',
		'deleted_at' => 'datetime',
	];
}
