<?php

namespace Modules\Venue\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Venue\Models\Screen;
use Modules\Venue\Repositories\Interfaces\ScreenRepositoryInterface;

class ScreenRepository extends BaseRepository implements ScreenRepositoryInterface
{
    protected array $with = ['venue'];

    public function __construct(Screen $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?Screen
    {
        return $this->newQuery()->where('code', $code)->first();
    }
}
