<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('line_item_venues', function (Blueprint $table) {
			$table->id();
			$table->foreignId('line_item_id')->constrained('line_items')->cascadeOnDelete();
			$table->foreignId('venue_id')->constrained('venues')->cascadeOnDelete();
			$table->timestamp('created_at')->useCurrent();

			$table->unique(['line_item_id', 'venue_id']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('line_item_venues');
	}
};
