<?php

namespace Modules\Creative\Events;

use Illuminate\Foundation\Events\Dispatchable;

class CreativeChanged
{
	use Dispatchable;

	public function __construct(public array $creativeIds) {}
}
