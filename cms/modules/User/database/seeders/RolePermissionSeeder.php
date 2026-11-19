<?php

namespace Modules\User\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\User\Models\Permission;
use Modules\User\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Define Roles
        $rolesData = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Unrestricted access to all system resources and modules',
            ],
            [
                'name' => 'admin',
                'display_name' => 'Administrator',
                'description' => 'Manages operational modules, users, venues, campaigns, and reports',
            ],
            [
                'name' => 'operator',
                'display_name' => 'DOOH Operator',
                'description' => 'Manages screens, playlists, schedules, simulator, and creative playback',
            ],
            [
                'name' => 'media_owner',
                'display_name' => 'Media Owner / Partner',
                'description' => 'Owns and operates physical venues and screen hardware assets',
            ],
            [
                'name' => 'viewer',
                'display_name' => 'Report Viewer',
                'description' => 'Read-only access to analytics, audit logs, and delivery metrics',
            ],
        ];

        $roles = [];
        foreach ($rolesData as $roleData) {
            $roles[$roleData['name']] = Role::firstOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        // 2. Define Permissions grouped by Module
        $permissionsData = [
            // Venue module
            ['name' => 'venue.view', 'module' => 'venue', 'display_name' => 'View Venues', 'description' => 'View screen venues and specifications'],
            ['name' => 'venue.create', 'module' => 'venue', 'display_name' => 'Create Venues', 'description' => 'Register new screen venues'],
            ['name' => 'venue.edit', 'module' => 'venue', 'display_name' => 'Edit Venues', 'description' => 'Modify screen venue details and tags'],
            ['name' => 'venue.delete', 'module' => 'venue', 'display_name' => 'Delete Venues', 'description' => 'Decommission or remove screen venues'],

            // Creative module
            ['name' => 'creative.view', 'module' => 'creative', 'display_name' => 'View Creatives', 'description' => 'Browse creative library and metadata'],
            ['name' => 'creative.upload', 'module' => 'creative', 'display_name' => 'Upload Creatives', 'description' => 'Upload video and image assets'],
            ['name' => 'creative.approve', 'module' => 'creative', 'display_name' => 'Approve Creatives', 'description' => 'Validate and approve creative assets for broadcast'],
            ['name' => 'creative.delete', 'module' => 'creative', 'display_name' => 'Delete Creatives', 'description' => 'Archive or delete creative assets'],

            // Delivery module
            ['name' => 'delivery.view', 'module' => 'delivery', 'display_name' => 'View Delivery', 'description' => 'View campaigns, line items, and flight schedules'],
            ['name' => 'delivery.create', 'module' => 'delivery', 'display_name' => 'Create Delivery', 'description' => 'Create campaigns and schedule line items'],
            ['name' => 'delivery.edit', 'module' => 'delivery', 'display_name' => 'Edit Delivery', 'description' => 'Modify flight dates, targets, and ad loops'],
            ['name' => 'delivery.publish', 'module' => 'delivery', 'display_name' => 'Publish Delivery', 'description' => 'Publish playlists live to edge players'],

            // Report module
            ['name' => 'report.view', 'module' => 'report', 'display_name' => 'View Reports', 'description' => 'Access delivery, impression, and play metrics'],
            ['name' => 'report.export', 'module' => 'report', 'display_name' => 'Export Reports', 'description' => 'Export aggregated CSV and Excel reports'],

            // Log module
            ['name' => 'log.view', 'module' => 'log', 'display_name' => 'View Logs', 'description' => 'Inspect raw tracking logs and verification beacons'],

            // Simulator module
            ['name' => 'simulator.view', 'module' => 'simulator', 'display_name' => 'View Simulator', 'description' => 'Preview live screen player and playlist emulation'],
            ['name' => 'simulator.control', 'module' => 'simulator', 'display_name' => 'Control Simulator', 'description' => 'Trigger virtual beacons and emergency broadcast loops'],

            // User & RBAC module
            ['name' => 'user.view', 'module' => 'user', 'display_name' => 'View Users', 'description' => 'View platform users and directory'],
            ['name' => 'user.create', 'module' => 'user', 'display_name' => 'Create Users', 'description' => 'Invite and provision new user accounts'],
            ['name' => 'user.edit', 'module' => 'user', 'display_name' => 'Edit Users', 'description' => 'Update profile details and account status'],
            ['name' => 'user.delete', 'module' => 'user', 'display_name' => 'Delete Users', 'description' => 'Deactivate or delete user accounts'],
            ['name' => 'user.roles', 'module' => 'user', 'display_name' => 'Manage Roles', 'description' => 'Assign and configure roles and permissions'],
        ];

        $permissions = [];
        foreach ($permissionsData as $permData) {
            $permissions[$permData['name']] = Permission::firstOrCreate(
                ['name' => $permData['name']],
                $permData
            );
        }

        // 3. Assign Permissions to Roles
        // super_admin -> all permissions
        $roles['super_admin']->permissions()->sync(array_values(array_map(fn ($p) => $p->id, $permissions)));

        // admin -> operational modules + user management (except deleting roles/super_admin)
        $adminPermissions = [
            'venue.view', 'venue.create', 'venue.edit', 'venue.delete',
            'creative.view', 'creative.upload', 'creative.approve', 'creative.delete',
            'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.publish',
            'report.view', 'report.export',
            'log.view',
            'simulator.view',
            'user.view', 'user.create', 'user.edit',
        ];
        $adminPermIds = array_map(fn ($name) => $permissions[$name]->id, array_filter($adminPermissions, fn ($n) => isset($permissions[$n])));
        $roles['admin']->permissions()->sync($adminPermIds);

        // operator -> screens, scheduling, creatives, simulator, view reports
        $operatorPermissions = [
            'venue.view', 'venue.edit',
            'creative.view', 'creative.upload',
            'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.publish',
            'simulator.view', 'simulator.control',
            'report.view',
            'log.view',
        ];
        $operatorPermIds = array_map(fn ($name) => $permissions[$name]->id, array_filter($operatorPermissions, fn ($n) => isset($permissions[$n])));
        $roles['operator']->permissions()->sync($operatorPermIds);

        // media_owner -> manages own venues, screens, and view reports
        $mediaOwnerPermissions = [
            'venue.view', 'venue.create', 'venue.edit', 'venue.delete',
            'report.view',
            'simulator.view',
        ];
        $mediaOwnerPermIds = array_map(fn ($name) => $permissions[$name]->id, array_filter($mediaOwnerPermissions, fn ($n) => isset($permissions[$n])));
        $roles['media_owner']->permissions()->sync($mediaOwnerPermIds);

        // viewer -> view only
        $viewerPermissions = [
            'venue.view',
            'creative.view',
            'delivery.view',
            'report.view',
            'log.view',
            'simulator.view',
        ];
        $viewerPermIds = array_map(fn ($name) => $permissions[$name]->id, array_filter($viewerPermissions, fn ($n) => isset($permissions[$n])));
        $roles['viewer']->permissions()->sync($viewerPermIds);
    }
}
