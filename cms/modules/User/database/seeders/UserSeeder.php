<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\User\Models\Role;
use Modules\User\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        // 1. Users assigned by Role (Cách 1)
        $roleUsers = [
            [
                'email' => 'admin@dooh.media',
                'name' => 'DOOH Super Admin',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
                'role' => 'super_admin',
            ],
            [
                'email' => 'operator@dooh.media',
                'name' => 'DOOH Operator',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
                'role' => 'operator',
            ],
            [
                'email' => 'viewer@dooh.media',
                'name' => 'DOOH Viewer',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
                'role' => 'viewer',
            ],
            [
                'email' => 'quanghuy.nguyen@urekamedia.vn',
                'name' => 'Quang Huy Nguyen',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
                'role' => 'super_admin',
            ]
        ];

        foreach ($roleUsers as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $user->assignRole($roleName);
        }

        // 2. User assigned by Direct Module Permissions (Cách 2)
        $customUser = User::updateOrCreate(
            ['email' => 'custom@dooh.media'],
            [
                'name' => 'DOOH Custom Permissions User',
                'password' => $defaultPassword,
                'email_verified_at' => now(),
            ]
        );

        // Assign explicit module permissions directly
        $customUser->assignDirectPermissions([
            'venue.view',
            'venue.create',
            'creative.view',
            'creative.upload',
            'delivery.view',
        ]);
    }
}
