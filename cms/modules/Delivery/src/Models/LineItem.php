<?php

namespace Modules\Delivery\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Core\Traits\Filterable;
use Modules\Creative\Models\Creative;
use Modules\Venue\Models\Screen;
use Modules\Venue\Models\Venue;

class LineItem extends Model
{
	use Filterable, SoftDeletes;

	protected $table = 'line_items';

	protected $fillable = [
		'campaign_id',
		'creative_id',
		'code',
		'name',
		'priority',
		'pacing_mode',
		'orientation',
		'start_date',
		'end_date',
		'target_impressions',
		'daily_impression_cap',
		'status',
	];

	protected array $filterable = [
		'search' => ['code', 'name'],
		'campaign_id' => '=',
		'status' => '=',
		'pacing_mode' => '=',
		'orientation' => '=',
	];

	protected function casts(): array
	{
		return [
			'priority' => 'integer',
			'target_impressions' => 'integer',
			'daily_impression_cap' => 'integer',
			'start_date' => 'date:Y-m-d',
			'end_date' => 'date:Y-m-d',
			'deleted_at' => 'datetime',
		];
	}

	public function campaign(): BelongsTo
	{
		return $this->belongsTo(Campaign::class, 'campaign_id');
	}

	public function creative(): BelongsTo
	{
		return $this->belongsTo(Creative::class, 'creative_id');
	}

	public function creatives(): BelongsToMany
	{
		return $this->belongsToMany(Creative::class, 'line_item_creatives', 'line_item_id', 'creative_id')->withPivot(['weight', 'status'])->withTimestamps();
	}

	public function venues(): BelongsToMany
	{
		return $this->belongsToMany(Venue::class, 'line_item_venues', 'line_item_id', 'venue_id');
	}

	public function screens(): BelongsToMany
	{
		return $this->belongsToMany(Screen::class, 'line_item_screens', 'line_item_id', 'screen_id')->withTimestamps();
	}
}
