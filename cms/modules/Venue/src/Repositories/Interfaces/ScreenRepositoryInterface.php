<?php

namespace Modules\Venue\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Venue\Models\Screen;

interface ScreenRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCode(string $code): ?Screen;
}
