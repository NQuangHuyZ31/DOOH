<?php

namespace Modules\Auth\Tests\Unit;

use Laravel\Sanctum\PersonalAccessToken;
use Mockery;
use Mockery\MockInterface;
use Modules\Auth\Services\AuthService;
use Modules\Auth\Services\OtpService;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use PHPUnit\Framework\TestCase;

class AuthServiceTest extends TestCase
{
    protected UserRepositoryInterface&MockInterface $userRepository;
    protected OtpService&MockInterface $otpService;
    protected AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userRepository = Mockery::mock(UserRepositoryInterface::class);
        $this->otpService = Mockery::mock(OtpService::class);
        $this->authService = new AuthService($this->userRepository, $this->otpService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_is_otp_enabled_delegates_to_otp_service(): void
    {
        $this->otpService->shouldReceive('isEnabled')->once()->andReturn(true);

        $this->assertTrue($this->authService->isOtpEnabled());
    }

    public function test_resend_otp_delegates_to_otp_service(): void
    {
        $user = new User(['name' => 'Operator', 'email' => 'op@dooh.media']);
        $user->id = 7;

        $this->otpService->shouldReceive('getSessionUserId')
            ->once()
            ->with('temp_abc')
            ->andReturn(7);

        $this->userRepository->shouldReceive('findById')
            ->once()
            ->with(7)
            ->andReturn($user);

        $expected = [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => 'temp_abc',
            'email' => 'o***@dooh.media',
        ];

        $this->otpService->shouldReceive('resend')
            ->once()
            ->with('temp_abc', $user)
            ->andReturn($expected);

        $result = $this->authService->resendOtp('temp_abc');

        $this->assertSame($expected, $result);
    }

    public function test_logout_deletes_current_access_token(): void
    {
        $tokenMock = Mockery::mock(PersonalAccessToken::class);
        $tokenMock->shouldReceive('delete')->once()->andReturn(true);

        $userMock = Mockery::mock(User::class)->makePartial();
        $userMock->shouldReceive('currentAccessToken')->once()->andReturn($tokenMock);

        $this->authService->logout($userMock);

        $this->assertTrue(true);
    }

    public function test_otp_service_masks_email_addresses_correctly(): void
    {
        $realOtpService = new OtpService();

        $this->assertSame('a***n@dooh.media', $realOtpService->maskEmail('admin@dooh.media'));
        $this->assertSame('ab***@dooh.media', $realOtpService->maskEmail('ab@dooh.media'));
        $this->assertSame('invalid-email', $realOtpService->maskEmail('invalid-email'));
    }
}
