<?php

return [
    'pagination' => [
        'default_per_page' => 10,
        'per_page_options' => [10, 20, 50, 100],
    ],

    'statuses' => [
        'common' => [
            ['value' => 'active', 'label' => 'Active', 'color' => 'success'],
            ['value' => 'inactive', 'label' => 'Inactive', 'color' => 'error'],
        ],
        'tags' => [
            'active' => ['color' => 'success', 'label' => 'Active'],
            'running' => ['color' => 'processing', 'label' => 'Running'],
            'paused' => ['color' => 'warning', 'label' => 'Paused'],
            'maintenance' => ['color' => 'warning', 'label' => 'Maintenance'],
            'pending' => ['color' => 'processing', 'label' => 'Pending'],
            'approved' => ['color' => 'success', 'label' => 'Approved'],
            'completed' => ['color' => 'default', 'label' => 'Completed'],
            'draft' => ['color' => 'default', 'label' => 'Draft'],
            'inactive' => ['color' => 'error', 'label' => 'Inactive'],
            'rejected' => ['color' => 'error', 'label' => 'Rejected'],
            'error' => ['color' => 'error', 'label' => 'Error'],
        ],
    ],

    'enums' => [
        'modules' => [
            ['value' => 'core', 'label' => 'Core (System & Infrastructure)', 'color' => 'default'],
            ['value' => 'auth', 'label' => 'Auth (Authentication & Security)', 'color' => 'gold'],
            ['value' => 'user', 'label' => 'User (User Management & RBAC)', 'color' => 'blue'],
            ['value' => 'venue', 'label' => 'Venue (Screen Venues & Hardware)', 'color' => 'geekblue'],
            ['value' => 'creative', 'label' => 'Creative (Media & Content Assets)', 'color' => 'purple'],
            ['value' => 'delivery', 'label' => 'Delivery (Pacing, Playlists & Campaigns)', 'color' => 'green'],
            ['value' => 'report', 'label' => 'Report (Analytics & Metrics)', 'color' => 'orange'],
            ['value' => 'log', 'label' => 'Log (Tracking Verification & Beacons)', 'color' => 'cyan'],
            ['value' => 'simulator', 'label' => 'Simulator (Virtual Edge Player)', 'color' => 'magenta'],
        ],
    ],
];
