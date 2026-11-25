<?php

namespace Modules\User\Tests\Unit;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Mockery;
use Modules\User\Events\UserDeleted;
use Modules\User\Events\UserSaved;
use Modules\User\Models\Role;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\User\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Modules\User\Services\UserService;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
	public function test_create_user_resolves_role_and_dispatches_user_saved_event(): void
	{
		Event::fake([UserSaved::class]);
		DB::shouldReceive('transaction')->once()->andReturnUsing(fn (callable $cb) => $cb());

		$role = new Role(['name' => 'operator']);
		$role->id = 3;

		$createdUser = new User(['name' => 'Alice', 'email' => 'alice@example.com']);
		$createdUser->id = 10;

		$userRepo = Mockery::mock(UserRepositoryInterface::class);
		$roleRepo = Mockery::mock(RoleRepositoryInterface::class);
		$permRepo = Mockery::mock(PermissionRepositoryInterface::class);

		$roleRepo->shouldReceive('findByName')->once()->with('operator')->andReturn($role);
		$userRepo->shouldReceive('create')->once()->with([
			'name' => 'Alice',
			'email' => 'alice@example.com',
			'password' => 'secret123',
			'permission_type' => User::PERMISSION_TYPE_ROLE,
			'role_id' => 3,
		])->andReturn($createdUser);
		$userRepo->shouldReceive('syncDirectPermissions')->once()->with($createdUser, []);
		$userRepo->shouldReceive('find')->once()->with(10)->andReturn($createdUser);

		$service = new UserService($userRepo, $roleRepo, $permRepo);
		$result = $service->createUser([
			'name' => 'Alice',
			'email' => 'alice@example.com',
			'password' => 'secret123',
			'role_id' => 'operator',
			'vendor_id' => 5,
		]);

		$this->assertSame(10, $result->id);
		Event::assertDispatched(UserSaved::class, fn (UserSaved $e) => $e->user->id === 10 && $e->isNew === true && $e->data['vendor_id'] === 5);
	}

	public function test_update_user_switching_to_direct_mode_clears_role_and_syncs_permissions(): void
	{
		Event::fake([UserSaved::class]);
		DB::shouldReceive('transaction')->once()->andReturnUsing(fn (callable $cb) => $cb());

		$existing = new User(['name' => 'Bob', 'email' => 'bob@example.com', 'permission_type' => User::PERMISSION_TYPE_ROLE]);
		$existing->id = 12;

		$userRepo = Mockery::mock(UserRepositoryInterface::class);
		$roleRepo = Mockery::mock(RoleRepositoryInterface::class);
		$permRepo = Mockery::mock(PermissionRepositoryInterface::class);

		$userRepo->shouldReceive('find')->twice()->with(12)->andReturn($existing);
		$permRepo->shouldReceive('getIdsByNames')->once()->with(['venue.view'])->andReturn([7]);
		$userRepo->shouldReceive('update')->once()->with(12, [
			'name' => 'Bob Updated',
			'permission_type' => User::PERMISSION_TYPE_DIRECT,
			'role_id' => null,
		])->andReturn(true);
		$userRepo->shouldReceive('syncDirectPermissions')->once()->with($existing, [2, 7]);

		$service = new UserService($userRepo, $roleRepo, $permRepo);
		$result = $service->updateUser(12, [
			'name' => 'Bob Updated',
			'permission_type' => User::PERMISSION_TYPE_DIRECT,
			'direct_permissions' => [2, 'venue.view'],
		]);

		$this->assertSame(12, $result->id);
		Event::assertDispatched(UserSaved::class, fn (UserSaved $e) => $e->user->id === 12 && $e->isNew === false);
	}

	public function test_delete_user_dispatches_user_deleted_event_only_when_deleted(): void
	{
		Event::fake([UserDeleted::class]);
		DB::shouldReceive('transaction')->twice()->andReturnUsing(fn (callable $cb) => $cb());

		$userRepo = Mockery::mock(UserRepositoryInterface::class);
		$roleRepo = Mockery::mock(RoleRepositoryInterface::class);
		$permRepo = Mockery::mock(PermissionRepositoryInterface::class);

		$userRepo->shouldReceive('delete')->once()->with(15)->andReturn(true);
		$userRepo->shouldReceive('delete')->once()->with(999)->andReturn(false);

		$service = new UserService($userRepo, $roleRepo, $permRepo);

		$this->assertTrue($service->deleteUser(15));
		$this->assertFalse($service->deleteUser(999));
		Event::assertDispatched(UserDeleted::class, fn (UserDeleted $e) => $e->userId === 15);
		Event::assertNotDispatched(UserDeleted::class, fn (UserDeleted $e) => $e->userId === 999);
	}

	public function test_send_reset_password_link_returns_404_when_user_not_found(): void
	{
		$userRepo = Mockery::mock(UserRepositoryInterface::class);
		$roleRepo = Mockery::mock(RoleRepositoryInterface::class);
		$permRepo = Mockery::mock(PermissionRepositoryInterface::class);

		$userRepo->shouldReceive('find')->once()->with(404)->andReturn(null);

		$service = new UserService($userRepo, $roleRepo, $permRepo);
		$result = $service->sendResetPasswordLink(404, 1);

		$this->assertFalse($result['success']);
		$this->assertSame(404, $result['code']);
	}

	public function test_send_reset_password_link_rejects_self_reset_with_400(): void
	{
		$user = Mockery::mock(User::class)->makePartial();
		$user->id = 7;
		$user->shouldReceive('hasRole')->once()->with(['super_admin', 'admin'])->andReturn(false);

		$userRepo = Mockery::mock(UserRepositoryInterface::class);
		$roleRepo = Mockery::mock(RoleRepositoryInterface::class);
		$permRepo = Mockery::mock(PermissionRepositoryInterface::class);

		$userRepo->shouldReceive('find')->once()->with(7)->andReturn($user);

		$service = new UserService($userRepo, $roleRepo, $permRepo);
		$result = $service->sendResetPasswordLink(7, 7);

		$this->assertFalse($result['success']);
		$this->assertSame(400, $result['code']);
	}
}
