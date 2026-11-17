<?php

namespace Modules\Auth\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Modules\Auth\Mail\OtpVerificationMail;
use Modules\Auth\Services\OtpService;
use Modules\User\Database\Seeders\RolePermissionSeeder;
use Modules\User\Database\Seeders\UserSeeder;
use Modules\User\Models\User;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
        $this->seed(RolePermissionSeeder::class);
        $this->seed(UserSeeder::class);
        $this->user = User::where('email', 'admin@dooh.media')->firstOrFail();
    }

    public function test_login_successful_without_otp(): void
    {
        config(['auth.email_otp.enabled' => false]);

        $response = $this->postJson('/admin/api/auth/login', [
            'email' => 'admin@dooh.media',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.require_otp', false)
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'token',
                    'user' => ['id', 'email', 'name', 'role', 'permissions'],
                ],
            ]);
    }

    public function test_login_successful_with_username_or_email_field(): void
    {
        config(['auth.email_otp.enabled' => false]);

        $response = $this->postJson('/admin/api/auth/login', [
            'username_or_email' => 'admin@dooh.media',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.email', 'admin@dooh.media');
    }

    public function test_login_validation_error_on_missing_fields_returns_422(): void
    {
        $response = $this->postJson('/admin/api/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/admin/api/auth/login', [
            'email' => 'admin@dooh.media',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_with_otp_enabled_queues_email_and_verifies(): void
    {
        config(['auth.email_otp.enabled' => true]);
        Mail::fake();

        $response = $this->postJson('/admin/api/auth/login', [
            'email' => 'admin@dooh.media',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.require_otp', true)
            ->assertJsonPath('data.step', 'email_otp');

        $tempToken = $response->json('data.temp_token');
        $this->assertNotEmpty($tempToken);

        Mail::assertQueued(OtpVerificationMail::class, function ($mail) {
            return $mail->hasTo('admin@dooh.media');
        });

        $resendResponse = $this->postJson('/admin/api/auth/resend-otp', [
            'temp_token' => $tempToken,
        ]);
        $resendResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.require_otp', true);

        $failResponse = $this->postJson('/admin/api/auth/verify-otp', [
            'temp_token' => $tempToken,
            'code' => '000000',
        ]);
        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['code']);

        $sessionData = Cache::get(OtpService::CACHE_PREFIX . $tempToken);
        $this->assertNotNull($sessionData);
        $validCode = $sessionData['otp'];

        $successResponse = $this->postJson('/admin/api/auth/verify-otp', [
            'temp_token' => $tempToken,
            'code' => $validCode,
        ]);

        $successResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.require_otp', false)
            ->assertJsonStructure([
                'data' => ['token', 'user'],
            ]);
    }

    public function test_verify_otp_exceeding_max_attempts_invalidates_session(): void
    {
        config([
            'auth.email_otp.enabled' => true,
            'auth.email_otp.max_attempts' => 2,
        ]);
        Mail::fake();

        $loginResponse = $this->postJson('/admin/api/auth/login', [
            'email' => 'admin@dooh.media',
            'password' => 'password123',
        ]);

        $tempToken = $loginResponse->json('data.temp_token');

        $this->postJson('/admin/api/auth/verify-otp', ['temp_token' => $tempToken, 'code' => '000001'])->assertStatus(422);
        $this->postJson('/admin/api/auth/verify-otp', ['temp_token' => $tempToken, 'code' => '000002'])->assertStatus(422);

        $lockedResponse = $this->postJson('/admin/api/auth/verify-otp', [
            'temp_token' => $tempToken,
            'code' => '000003',
        ]);

        $lockedResponse->assertStatus(422)
            ->assertJsonValidationErrors(['code']);

        $this->assertNull(Cache::get(OtpService::CACHE_PREFIX . $tempToken));
    }

    public function test_me_unauthenticated_returns_401(): void
    {
        $response = $this->getJson('/admin/api/auth/me');

        $response->assertStatus(401)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_me_returns_authenticated_user_details(): void
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/admin/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.email', 'admin@dooh.media')
            ->assertJsonPath('data.role', 'super_admin');
    }

    public function test_logout_revokes_token(): void
    {
        $token = $this->user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/admin/api/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $this->user->id,
            'name' => 'test_token',
        ]);
    }
}
