<?php

namespace Modules\User\Events;

class UserDeleted
{
	public function __construct(public int $userId) {}
}
