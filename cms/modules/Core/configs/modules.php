<?php

return [
    'admin_prefix' => env('CMS_ADMIN_PREFIX', 'admin'),
    'api_prefix' => env('CMS_API_PREFIX', 'admin/api'),
    'default_module' => env('CMS_DEFAULT_MODULE', 'venues'),

    'modules' => [
        'Core',
        'Auth',
        'Venue',
        'Creative',
        'Delivery',
        'Report',
        'Log',
        'Simulator',
    ],
    'routes' => [
        'core',
        'auth',
        'venue',
        'creative',
        'delivery',
        'report',
        'log',
        'simulator',
    ],
];
