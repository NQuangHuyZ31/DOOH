<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('simulator_screens', function (Blueprint $table) {
			$table->id();
			$table->foreignId('venue_id')->nullable()->constrained('venues')->nullOnDelete();
			$table->foreignId('cms_screen_id')->nullable()->constrained('screens')->nullOnDelete();
			$table->string('name');
			$table->string('screen_type', 32)->default('led');
			$table->unsignedInteger('resolution_width')->default(1920);
			$table->unsignedInteger('resolution_height')->default(1080);
			$table->string('orientation', 32)->default('landscape');
			$table->string('aspect_ratio', 16)->nullable();
			$table->boolean('has_audio')->default(false);
			$table->unsignedInteger('loop_duration_seconds')->default(120);
			$table->unsignedInteger('default_slot_seconds')->default(15);
			$table->string('sync_status', 32)->default('unsynced')->index();
			$table->string('synced_code', 64)->nullable();
			$table->string('synced_secret_key', 128)->nullable();
			$table->timestamp('synced_at')->nullable();
			$table->timestamps();
			$table->softDeletes();
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('simulator_screens');
	}
};
