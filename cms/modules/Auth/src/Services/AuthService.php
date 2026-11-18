<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Resources\UserResource;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected OtpService $otpService
    ) {}

    public function isOtpEnabled(): bool
    {
        return $this->otpService->isEnabled();
    }

    /**
     * @return array<string, mixed>
     */
    public function login(string $email, string $password, ?string $ip = null, ?string $userAgent = null): array
    {
        $user = $this->userRepository->findByEmail($email);
        $dummyHash = '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

        if (!$user || !Hash::check($password, $user->password ?? $dummyHash)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($this->isOtpEnabled()) {
            return $this->otpService->initiate($user, $ip, $userAgent);
        }

        return $this->finalizeLogin($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function verifyOtp(string $tempToken, string $code): array
    {
        $userId = $this->otpService->verify($tempToken, $code);
        $user = $this->userRepository->find($userId);

        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        return $this->finalizeLogin($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function resendOtp(string $tempToken): array
    {
        $userId = $this->otpService->getSessionUserId($tempToken);
        $user = $this->userRepository->find($userId);

        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        return $this->otpService->resend($tempToken, $user);
    }

    /**
     * @return array<string, mixed>
     */
    public function me(User $user): array
    {
        return UserResource::make($user)->resolve();
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token) {
            $token->delete();
        } else {
            $user->tokens()->delete();
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function resetPassword(string $email, string $token, string $password, string $passwordConfirmation): array
    {
        $status = Password::broker('users')->reset(
            [
                'email' => $email,
                'token' => $token,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ],
            function (User $user, string $pwd) {
                $user->forceFill([
                    'password' => Hash::make($pwd),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => [__($status)],
            ]);
        }

        return ['status' => 'success'];
    }

    /**
     * @return array<string, mixed>
     */
    protected function finalizeLogin(User $user): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'step' => 'completed',
            'require_otp' => false,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => UserResource::make($user)->resolve(),
        ];
    }
}
