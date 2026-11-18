<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\User\Models\User;
use Modules\Auth\Jobs\SendMailOPT;

class OtpService
{
    public const MAX_OTP_ATTEMPTS = 5;
    public const DEFAULT_OTP_TTL_MINUTES = 5;
    public const CACHE_PREFIX = 'auth_email_otp_';

    public function isEnabled(): bool
    {
        return filter_var(
            config('auth.email_otp.enabled', false),
            FILTER_VALIDATE_BOOLEAN
        );
    }

    public function getTtlMinutes(): int
    {
        return (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_OTP_TTL_MINUTES);
    }

    public function getMaxAttempts(): int
    {
        return (int) config('auth.email_otp.max_attempts', self::MAX_OTP_ATTEMPTS);
    }

    /**
     * @return array<string, mixed>
     */
    public function initiate(User $user, ?string $ip = null, ?string $userAgent = null): array
    {
        $otp = $this->generateOtpCode();
        $tempToken = Str::random(64);
        $ttlMinutes = $this->getTtlMinutes();

        $sessionData = [
            'user_id' => $user->id,
            'otp' => $otp,
            'email' => $user->email,
            'attempts' => 0,
            'ip' => $ip,
            'user_agent' => $userAgent,
        ];

        Cache::put($this->cacheKey($tempToken), $sessionData, now()->addMinutes($ttlMinutes));
        $this->dispatchOtpMail($user, $otp, $ttlMinutes);

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A 6-digit verification code has been dispatched to your email address.',
        ];
    }

    public function verify(string $tempToken, string $code): int
    {
        $cacheKey = $this->cacheKey($tempToken);
        $data = Cache::get($cacheKey);

        if (!is_array($data)) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired or is invalid. Please sign in again.'],
            ]);
        }

        $maxAttempts = $this->getMaxAttempts();
        $attempts = (int) ($data['attempts'] ?? 0) + 1;

        if ($attempts > $maxAttempts) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'code' => ['Too many failed verification attempts. Please sign in again.'],
            ]);
        }

        if (trim($code) !== (string) $data['otp']) {
            $data['attempts'] = $attempts;
            Cache::put($cacheKey, $data, now()->addMinutes($this->getTtlMinutes()));

            $remaining = $maxAttempts - $attempts;
            throw ValidationException::withMessages([
                'code' => ["Invalid verification code. {$remaining} attempt(s) remaining."],
            ]);
        }

        Cache::forget($cacheKey);

        return (int) $data['user_id'];
    }

    public function getSessionUserId(string $tempToken): int
    {
        $data = Cache::get($this->cacheKey($tempToken));

        if (!is_array($data) || empty($data['user_id'])) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired. Please sign in again.'],
            ]);
        }

        return (int) $data['user_id'];
    }

    /**
     * @return array<string, mixed>
     */
    public function resend(string $tempToken, User $user): array
    {
        $cacheKey = $this->cacheKey($tempToken);
        $data = Cache::get($cacheKey);

        if (!is_array($data)) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired. Please sign in again.'],
            ]);
        }

        $otp = $this->generateOtpCode();
        $ttlMinutes = $this->getTtlMinutes();

        $data['otp'] = $otp;
        $data['attempts'] = 0;

        Cache::put($cacheKey, $data, now()->addMinutes($ttlMinutes));
        $this->dispatchOtpMail($user, $otp, $ttlMinutes);

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A fresh verification code has been dispatched to your email address.',
        ];
    }

    public function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        [$name, $domain] = $parts;
        $length = strlen($name);

        if ($length <= 2) {
            return $name . '***@' . $domain;
        }

        return substr($name, 0, 1) . str_repeat('*', min(5, $length - 2)) . substr($name, -1) . '@' . $domain;
    }

    protected function cacheKey(string $tempToken): string
    {
        return self::CACHE_PREFIX . $tempToken;
    }

    protected function generateOtpCode(): string
    {
        return sprintf('%06d', random_int(100000, 999999));
    }

    protected function dispatchOtpMail(User $user, string $otp, int $ttlMinutes): void
    {
        SendMailOPT::dispatch($user->name, $otp, $user->email, $ttlMinutes);
    }
}
