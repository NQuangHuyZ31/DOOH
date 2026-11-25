<?php

namespace Modules\User\Events;

use Modules\User\Models\User;

class UserSaved
{
	public function __construct(public User $user, public array $data = [], public bool $isNew = false) {}
}
