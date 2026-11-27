<?php

namespace Modules\Simulator\Repositories;

use Modules\Core\Repositories\BaseRepository;
use Modules\Simulator\Models\SimulatorScreen;
use Modules\Simulator\Repositories\Interfaces\SimulatorScreenRepositoryInterface;

class SimulatorScreenRepository extends BaseRepository implements SimulatorScreenRepositoryInterface
{
	protected array $with = [];

	public function __construct(SimulatorScreen $model)
	{
		parent::__construct($model);
	}
}
