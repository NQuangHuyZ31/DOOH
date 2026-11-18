<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Modules\User\Models\Role;
use Modules\User\Models\User;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create and authenticate a super admin user for testing.
     */
    protected function authenticateAsSuperAdmin(): User
    {
        $role = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['display_name' => 'Super Administrator']
        );

        $user = User::firstOrCreate(
            ['email' => 'admin@dooh.media'],
            [
                'name' => 'Super Administrator',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role_id' => $role->id,
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ]
        );

        $this->actingAs($user, 'web');

        return $user;
    }
}
