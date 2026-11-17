<?php

namespace Modules\Auth\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Http\Requests\ResendOtpRequest;
use Modules\Auth\Http\Requests\VerifyOtpRequest;
use Modules\Auth\Services\AuthService;
use Modules\Core\Http\Controllers\BaseController;

class AuthController extends BaseController
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $this->authService->login(
            $request->getEmail(),
            $request->validated('password'),
            $request->ip(),
            $request->userAgent()
        );

        $message = !empty($data['require_otp'])
            ? 'Email verification code sent.'
            : 'Login successful.';

        return $this->respondSuccess($data, $message);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $data = $this->authService->verifyOtp(
            $request->validated('temp_token'),
            $request->validated('code')
        );

        return $this->respondSuccess($data, 'Verification successful.');
    }

    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        $data = $this->authService->resendOtp($request->validated('temp_token'));

        return $this->respondSuccess($data, 'Fresh verification code dispatched.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth('sanctum')->user();
        if (!$user) {
            return $this->respondUnauthorized('Unauthenticated.');
        }

        return $this->respondSuccess($this->authService->me($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user() ?? auth('sanctum')->user();
        if ($user) {
            $this->authService->logout($user);
        }

        return $this->respondSuccess(null, 'Logged out successfully.');
    }
}
