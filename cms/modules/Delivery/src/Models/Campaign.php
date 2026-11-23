<?php

namespace Modules\Delivery\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;
use Modules\Core\Traits\HasOwner;
use Modules\User\Models\User;

class Campaign extends Model
{
	use Filterable, HasOwner, SoftDeletes;

	protected $table = 'campaigns';

	protected string $ownerColumn = 'user_id';

	protected $fillable = [
		'user_id',
		'code',
		'name',
		'description',
		'total_budget',
		'start_date',
		'end_date',
		'status',
	];

	protected array $filterable = [
		'search' => ['code', 'name', 'description'],
		'status' => '=',
		'user_id' => '=',
	];

	protected function casts(): array
	{
		return [
			'total_budget' => 'float',
			'start_date' => 'date:Y-m-d',
			'end_date' => 'date:Y-m-d',
			'deleted_at' => 'datetime',
		];
	}

	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function lineItems(): HasMany
	{
		return $this->hasMany(LineItem::class, 'campaign_id');
	}
}
