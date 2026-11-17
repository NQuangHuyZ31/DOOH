<?php

use App\Providers\AppServiceProvider;
use Modules\Core\Providers\CoreServiceProvider;
use Modules\Venue\Providers\VenueServiceProvider;
use Modules\Auth\Providers\AuthServiceProvider;
use Modules\Creative\Providers\CreativeServiceProvider;
use Modules\Delivery\Providers\DeliveryServiceProvider;
use Modules\Report\Providers\ReportServiceProvider;
use Modules\Log\Providers\LogServiceProvider;
use Modules\Simulator\Providers\SimulatorServiceProvider;

return [
    AppServiceProvider::class,
    CoreServiceProvider::class,
    VenueServiceProvider::class,
    AuthServiceProvider::class,
    CreativeServiceProvider::class,
    DeliveryServiceProvider::class,
    ReportServiceProvider::class,
    LogServiceProvider::class,
    SimulatorServiceProvider::class,
];
