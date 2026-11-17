<?php

namespace Modules\Venue\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface VenueRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCode(string $code);
}
