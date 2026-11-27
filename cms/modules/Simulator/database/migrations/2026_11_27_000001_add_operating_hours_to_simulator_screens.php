<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::table('simulator_screens', function (Blueprint $table) {
			$table->time('opening_time')->default('06:00:00')->after('default_slot_seconds');
			$table->time('closing_time')->default('23:00:00')->after('opening_time');
			$table->boolean('is_24_7')->default(false)->after('closing_time');
		});
	}

	public function down(): void
	{
		Schema::table('simulator_screens', function (Blueprint $table) {
			$table->dropColumn(['opening_time', 'closing_time', 'is_24_7']);
		});
	}
};
