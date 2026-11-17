<?php

namespace Modules\Venue\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Venue\Repositories\Interfaces\VenueRepositoryInterface;
use Modules\Venue\Repositories\VenueRepository;

class VenueServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(VenueRepositoryInterface::class, VenueRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
