<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::table('simulator_screens', function (Blueprint $table) {
			$table->dropConstrainedForeignId('venue_id');
			$table->dropConstrainedForeignId('cms_screen_id');
			$table->string('location_name', 255)->default('')->after('name');
			$table->string('city', 120)->default('')->after('location_name');
			$table->string('sub_location', 255)->nullable()->after('city');
			$table->string('hardware_device_uid', 128)->nullable()->after('default_slot_seconds');
		});
	}

	public function down(): void
	{
		Schema::table('simulator_screens', function (Blueprint $table) {
			$table->dropColumn(['location_name', 'city', 'sub_location', 'hardware_device_uid']);
			$table->foreignId('venue_id')->nullable()->after('id')->constrained('venues')->nullOnDelete();
			$table->foreignId('cms_screen_id')->nullable()->after('venue_id')->constrained('screens')->nullOnDelete();
		});
	}
};
