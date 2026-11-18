<?php

return [
    'enabled' => env('AUTH_EMAIL_OTP_ENABLED', false),
    'ttl_minutes' => (int) env('AUTH_EMAIL_OTP_TTL_MINUTES', 5),
    'max_attempts' => (int) env('AUTH_EMAIL_OTP_MAX_ATTEMPTS', 5),
];
