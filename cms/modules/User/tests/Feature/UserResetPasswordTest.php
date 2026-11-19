<?php

namespace Modules\User\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\User\Jobs\SendResetPasswordMailJob;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Tests\TestCase;

class UserResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate');
    }

    public function test_admin_can_send_reset_password_email_for_regular_user(): void
    {
        Queue::fake();

        $this->authenticateAsSuperAdmin();

        $operatorRole = Role::create([
            'name' => 'operator',
            'display_name' => 'Operator',
        ]);

        $targetUser = User::create([
            'name' => 'Operator User',
            'email' => 'operator@example.com',
            'password' => 'OldPassword123!',
            'role_id' => $operatorRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $response = $this->postJson("/admin/api/user/{$targetUser->id}/reset-password");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        Queue::assertPushed(SendResetPasswordMailJob::class, function ($job) use ($targetUser) {
            return $job->toEmail === $targetUser->email
                && str_contains($job->resetUrl, 'reset-password=1')
                && str_contains($job->resetUrl, urlencode($targetUser->email));
        });

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'operator@example.com',
        ]);
    }

    public function test_reset_password_for_admin_or_super_admin_is_rejected(): void
    {
        $this->authenticateAsSuperAdmin();

        $adminRole = Role::create([
            'name' => 'admin',
            'display_name' => 'Admin',
        ]);

        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin2@example.com',
            'password' => 'OldPassword123!',
            'role_id' => $adminRole->id,
            'permission_type' => User::PERMISSION_TYPE_ROLE,
        ]);

        $response = $this->postJson("/admin/api/user/{$adminUser->id}/reset-password");

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'Cannot reset password for Admin or Super Admin accounts.');
    }

    public function test_reset_password_for_current_user_is_rejected(): void
    {
        $currentUser = $this->authenticateAsSuperAdmin();

        $response = $this->postJson("/admin/api/user/{$currentUser->id}/reset-password");

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error');
    }

    public function test_reset_password_for_non_existent_user_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/admin/api/user/999999/reset-password');
        $response->assertStatus(404);
    }
}
