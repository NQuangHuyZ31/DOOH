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
        'venue' => [
            ['value' => 'active', 'label' => 'Active', 'color' => 'success'],
            ['value' => 'inactive', 'label' => 'Inactive', 'color' => 'error'],
            ['value' => 'maintenance', 'label' => 'Maintenance', 'color' => 'warning'],
        ],
        'creative' => [
            ['value' => 'draft', 'label' => 'Draft', 'color' => 'default'],
            ['value' => 'pending_review', 'label' => 'Pending Review', 'color' => 'warning'],
            ['value' => 'approved', 'label' => 'Approved', 'color' => 'success'],
            ['value' => 'rejected', 'label' => 'Rejected', 'color' => 'error'],
        ],
        'vendor' => [
            ['value' => 'active', 'label' => 'Active', 'color' => 'success'],
            ['value' => 'inactive', 'label' => 'Inactive', 'color' => 'error'],
            ['value' => 'suspended', 'label' => 'Suspended', 'color' => 'warning'],
        ],
        'tags' => [
            'active' => ['color' => 'success', 'label' => 'Active'],
            'running' => ['color' => 'processing', 'label' => 'Running'],
            'paused' => ['color' => 'warning', 'label' => 'Paused'],
            'maintenance' => ['color' => 'warning', 'label' => 'Maintenance'],
            'pending' => ['color' => 'processing', 'label' => 'Pending'],
            'pending_review' => ['color' => 'warning', 'label' => 'Pending Review'],
            'approved' => ['color' => 'success', 'label' => 'Approved'],
            'completed' => ['color' => 'default', 'label' => 'Completed'],
            'draft' => ['color' => 'default', 'label' => 'Draft'],
            'inactive' => ['color' => 'error', 'label' => 'Inactive'],
            'suspended' => ['color' => 'warning', 'label' => 'Suspended'],
            'rejected' => ['color' => 'error', 'label' => 'Rejected'],
            'error' => ['color' => 'error', 'label' => 'Error'],
            'online' => ['color' => 'success', 'label' => 'Online'],
            'offline' => ['color' => 'error', 'label' => 'Offline'],
            'degraded' => ['color' => 'warning', 'label' => 'Degraded'],
        ],
    ],

    'enums' => [
        'venue_types' => [
            ['value' => 'shopping_mall', 'label' => 'Shopping Mall'],
            ['value' => 'airport', 'label' => 'Airport'],
            ['value' => 'office_building', 'label' => 'Office Building'],
            ['value' => 'residential_elevator', 'label' => 'Residential Elevator'],
            ['value' => 'highway_billboard', 'label' => 'Highway Billboard'],
            ['value' => 'transit_station', 'label' => 'Transit Station'],
            ['value' => 'gas_station', 'label' => 'Gas Station'],
            ['value' => 'convenience_store', 'label' => 'Convenience Store'],
            ['value' => 'street_furniture', 'label' => 'Street Furniture'],
        ],
        'screen_types' => [
            ['value' => 'outdoor_led', 'label' => 'Outdoor LED'],
            ['value' => 'indoor_led', 'label' => 'Indoor LED'],
            ['value' => 'lcd_commercial', 'label' => 'Commercial LCD'],
            ['value' => 'elevator_screen', 'label' => 'Elevator Screen'],
            ['value' => 'kiosk_totem', 'label' => 'Kiosk / Totem'],
        ],
        'orientations' => [
            ['value' => 'landscape', 'label' => 'Landscape (16:9)'],
            ['value' => 'portrait', 'label' => 'Portrait (9:16)'],
            ['value' => 'custom', 'label' => 'Custom Aspect'],
        ],
        'connectivity_statuses' => [
            ['value' => 'online', 'label' => 'Online', 'color' => 'success'],
            ['value' => 'offline', 'label' => 'Offline', 'color' => 'error'],
            ['value' => 'degraded', 'label' => 'Degraded', 'color' => 'warning'],
        ],
        'creative_types' => [
            ['value' => 'video', 'label' => 'Video (MP4)', 'color' => 'blue'],
            ['value' => 'image', 'label' => 'Image (JPG/PNG/WebP)', 'color' => 'green'],
            ['value' => 'html5', 'label' => 'HTML5 Package', 'color' => 'purple'],
            ['value' => 'vast', 'label' => 'VAST XML Tag', 'color' => 'orange'],
        ],
        'modules' => [
            ['value' => 'core', 'label' => 'Core (System & Infrastructure)', 'color' => 'default'],
            ['value' => 'auth', 'label' => 'Auth (Authentication & Security)', 'color' => 'gold'],
            ['value' => 'vendor', 'label' => 'Vendor (Vendor Management)', 'color' => 'yellow'],
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
