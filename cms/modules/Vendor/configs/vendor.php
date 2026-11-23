<?php

return [
	'api_key_prefix' => env('VENDOR_API_KEY_PREFIX', 'dooh_live_'),
	'default_rate_limit_per_minute' => (int) env('VENDOR_RATE_LIMIT_PER_MINUTE', 120),
];
