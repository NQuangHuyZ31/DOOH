<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\User\Models\User;
use Modules\User\Services\UserService;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userService = app(UserService::class);
        $defaultPassword = 'password123';

        // 1. Users assigned by Role (Cách 1)
        $roleUsers = [
            [
                'email' => 'admin@dooh.media',
                'name' => 'DOOH Super Admin',
                'password' => $defaultPassword,
                'role_id' => 'super_admin',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
            [
                'email' => 'operator@dooh.media',
                'name' => 'DOOH Operator',
                'password' => $defaultPassword,
                'role_id' => 'operator',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
            [
                'email' => 'finance@dooh.media',
                'name' => 'DOOH Finance',
                'password' => $defaultPassword,
                'role_id' => 'finance',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
            [
                'email' => 'viewer@dooh.media',
                'name' => 'DOOH Viewer',
                'password' => $defaultPassword,
                'role_id' => 'viewer',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
            [
                'email' => 'quanghuy.nguyen@urekamedia.vn',
                'name' => 'Quang Huy Nguyen',
                'password' => $defaultPassword,
                'role_id' => 'super_admin',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
            [
                'email' => 'mediaowner@dooh.media',
                'name' => 'Media Owner',
                'password' => $defaultPassword,
                'role_id' => 'media_owner',
                'permission_type' => User::PERMISSION_TYPE_ROLE,
            ],
        ];

        foreach ($roleUsers as $userData) {
            $existing = User::where('email', $userData['email'])->first();
            if ($existing) {
                $userService->updateUser($existing->id, $userData);
            } else {
                $userService->createUser($userData);
            }
        }

        // 2. User assigned by Direct Module Permissions (Cách 2)
        $customUserData = [
            'email' => 'custom@dooh.media',
            'name' => 'DOOH Custom Permissions User',
            'password' => $defaultPassword,
            'permission_type' => User::PERMISSION_TYPE_DIRECT,
            'direct_permissions' => [
                'venue.view',
                'venue.create',
                'creative.view',
                'creative.upload',
                'delivery.view',
            ],
        ];

        $existingCustom = User::where('email', $customUserData['email'])->first();
        if ($existingCustom) {
            $userService->updateUser($existingCustom->id, $customUserData);
        } else {
            $userService->createUser($customUserData);
        }
    }
}
