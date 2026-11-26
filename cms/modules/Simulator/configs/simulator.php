<?php

return [
	'node_api_url' => env('NODE_TRACKING_API_URL', 'http://localhost:3000'),
	'node_api_prefix' => env('NODE_TRACKING_API_PREFIX', '/api/v1'),
	'node_api_timeout_seconds' => (int) env('NODE_TRACKING_API_TIMEOUT', 3),
];
