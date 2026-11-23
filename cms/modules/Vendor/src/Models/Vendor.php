<?php

namespace Modules\Vendor\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;
use Modules\Core\Traits\HasOwner;
use Modules\User\Models\User;
use Modules\Venue\Models\Venue;

class Vendor extends Model
{
	use Filterable, HasOwner, SoftDeletes;

	protected $table = 'vendors';

	protected string $ownerColumn = 'user_id';

	protected $fillable = [
		'code',
		'name',
		'company_name',
		'tax_code',
		'contact_name',
		'contact_email',
		'contact_phone',
		'address',
		'user_id',
		'api_key_hash',
		'api_key_prefix',
		'rate_limit_per_minute',
		'revenue_share_percentage',
		'status',
		'last_active_at',
	];

	protected array $filterable = [
		'search' => ['code', 'name', 'company_name', 'contact_name', 'contact_email', 'tax_code'],
		'status' => '=',
		'user_id' => '=',
	];

	protected $hidden = [
		'api_key_hash',
	];

	protected function casts(): array
	{
		return [
			'rate_limit_per_minute' => 'integer',
			'revenue_share_percentage' => 'float',
			'last_active_at' => 'datetime',
			'deleted_at' => 'datetime',
		];
	}

	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function venues(): HasMany
	{
		return $this->hasMany(Venue::class, 'media_owner_id', 'user_id');
	}
}
