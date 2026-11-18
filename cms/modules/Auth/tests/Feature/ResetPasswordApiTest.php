<?php

namespace Modules\Auth\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Modules\User\Models\User;
use Tests\TestCase;

class ResetPasswordApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('OldPassword123!'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $token = Password::broker('users')->createToken($user);

        $payload = [
            'email' => 'john@example.com',
            'token' => $token,
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ];

        $response = $this->postJson('/admin/api/auth/reset-password', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword456!', $user->password));

        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'john@example.com',
        ]);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('OldPassword123!'),
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $payload = [
            'email' => 'john@example.com',
            'token' => 'invalid-token-12345',
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ];

        $response = $this->postJson('/admin/api/auth/reset-password', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }
}
