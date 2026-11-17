<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public const MAX_OTP_ATTEMPTS = 5;
    public const DEFAULT_OTP_TTL_MINUTES = 5;

    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function isOtpEnabled(): bool
    {
        return (bool) config('auth.email_otp.enabled', false);
    }

    public function login(string $email, string $password, ?string $ip = null, ?string $userAgent = null): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($this->isOtpEnabled()) {
            return $this->initiateEmailOtp($user, $ip, $userAgent);
        }

        return $this->finalizeLogin($user);
    }

    public function verifyOtp(string $tempToken, string $code): array
    {
        $cacheKey = "auth_email_otp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired or is invalid. Please sign in again.'],
            ]);
        }

        $attempts = (int) ($data['attempts'] ?? 0) + 1;
        if ($attempts > self::MAX_OTP_ATTEMPTS) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'code' => ['Too many failed verification attempts. Please sign in again.'],
            ]);
        }

        if (trim($code) !== (string) $data['otp']) {
            $data['attempts'] = $attempts;
            $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_OTP_TTL_MINUTES);
            Cache::put($cacheKey, $data, now()->addMinutes($ttlMinutes));

            throw ValidationException::withMessages([
                'code' => ['Invalid verification code. Please check your email.'],
            ]);
        }

        Cache::forget($cacheKey);

        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        return $this->finalizeLogin($user);
    }

    public function resendOtp(string $tempToken): array
    {
        $cacheKey = "auth_email_otp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired. Please sign in again.'],
            ]);
        }

        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        $otp = sprintf('%06d', random_int(100000, 999999));
        $data['otp'] = $otp;
        $data['attempts'] = 0;

        $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_OTP_TTL_MINUTES);
        Cache::put($cacheKey, $data, now()->addMinutes($ttlMinutes));

        Log::info("Resent Login OTP for [{$user->email}]: {$otp}");

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A fresh verification code has been sent to your email address.',
        ];
    }

    public function me(User $user): array
    {
        return $this->formatUserData($user);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    protected function initiateEmailOtp(User $user, ?string $ip = null, ?string $userAgent = null): array
    {
        $otp = sprintf('%06d', random_int(100000, 999999));
        $tempToken = Str::random(64);
        $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_OTP_TTL_MINUTES);

        $sessionData = [
            'user_id' => $user->id,
            'otp' => $otp,
            'email' => $user->email,
            'attempts' => 0,
            'ip' => $ip,
            'user_agent' => $userAgent,
        ];

        Cache::put("auth_email_otp_{$tempToken}", $sessionData, now()->addMinutes($ttlMinutes));

        Log::info("Generated Login OTP for [{$user->email}]: {$otp} (temp_token: {$tempToken})");

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A 6-digit verification code has been sent to your email address.',
        ];
    }

    protected function finalizeLogin(User $user): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'step' => 'completed',
            'require_otp' => false,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUserData($user),
        ];
    }

    protected function formatUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }

    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $name = $parts[0];
        $domain = $parts[1];
        $length = strlen($name);

        if ($length <= 2) {
            return $name . '***@' . $domain;
        }

        return substr($name, 0, 1) . str_repeat('*', min(5, $length - 2)) . substr($name, -1) . '@' . $domain;
    }
}
