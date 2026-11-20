<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Modules\Creative\Database\Seeders\CreativeSeeder;
use Modules\User\Database\Seeders\RolePermissionSeeder;
use Modules\User\Database\Seeders\UserSeeder;
use Modules\Venue\Database\Seeders\VenueSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
            VenueSeeder::class,
            CreativeSeeder::class,
        ]);
    }
}
