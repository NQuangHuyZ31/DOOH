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

    'enums' => [],
];
