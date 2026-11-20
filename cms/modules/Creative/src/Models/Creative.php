<?php

namespace Modules\Creative\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\User\Models\User;

class Creative extends Model
{
	use SoftDeletes;

	protected $table = 'creatives';

	protected $fillable = [
		'user_id',
		'approved_by',
		'approved_at',
		'name',
		'code',
		'type',
		'status',
		'media_url',
		'thumbnail_url',
		'width',
		'height',
		'aspect_ratio',
		'duration_seconds',
		'file_size_bytes',
		'mime_type',
		'rejection_reason',
		'metadata',
	];

	protected $casts = [
		'width' => 'integer',
		'height' => 'integer',
		'duration_seconds' => 'integer',
		'file_size_bytes' => 'integer',
		'approved_at' => 'datetime',
		'metadata' => 'array',
	];

	public function creator(): BelongsTo
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function approver(): BelongsTo
	{
		return $this->belongsTo(User::class, 'approved_by');
	}
}
