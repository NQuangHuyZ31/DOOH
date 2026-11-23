<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::table('line_items', function (Blueprint $table) {
			$table->string('orientation', 32)->default('landscape')->after('pacing_mode');
		});

		Schema::create('line_item_screens', function (Blueprint $table) {
			$table->id();
			$table->foreignId('line_item_id')->constrained('line_items')->cascadeOnDelete();
			$table->foreignId('screen_id')->constrained('screens')->cascadeOnDelete();
			$table->timestamps();

			$table->unique(['line_item_id', 'screen_id']);
			$table->index('screen_id');
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('line_item_screens');
		Schema::table('line_items', function (Blueprint $table) {
			$table->dropColumn('orientation');
		});
	}
};
