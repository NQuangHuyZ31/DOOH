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

        $users = [
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
        ];

        foreach ($users as $userData) {
            $roleName = $userData['role'];
            unset($userData['role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $user->roles()->syncWithoutDetaching([$role->id]);
            }
        }
    }
}
