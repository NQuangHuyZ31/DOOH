<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add role_id and permission_type to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')
                ->nullable()
                ->after('email')
                ->constrained('roles')
                ->nullOnDelete();

            $table->enum('permission_type', ['role', 'direct'])
                ->default('role')
                ->after('role_id');
        });

        // 2. Create user_permissions table for direct module permission assignment
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['user_id', 'permission_id']);
        });

        // 3. Migrate existing user_roles records to users.role_id and drop user_roles
        if (Schema::hasTable('user_roles')) {
            $existingUserRoles = DB::table('user_roles')->get();
            foreach ($existingUserRoles as $ur) {
                DB::table('users')
                    ->where('id', $ur->user_id)
                    ->update([
                        'role_id' => $ur->role_id,
                        'permission_type' => 'role',
                    ]);
            }

            Schema::dropIfExists('user_roles');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Recreate user_roles table
        Schema::create('user_roles', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->primary(['user_id', 'role_id']);
        });

        // 2. Restore user_roles from users.role_id
        $users = DB::table('users')->whereNotNull('role_id')->get();
        foreach ($users as $user) {
            DB::table('user_roles')->insertOrIgnore([
                'user_id' => $user->id,
                'role_id' => $user->role_id,
            ]);
        }

        // 3. Drop user_permissions
        Schema::dropIfExists('user_permissions');

        // 4. Drop columns from users
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn(['role_id', 'permission_type']);
        });
    }
};
