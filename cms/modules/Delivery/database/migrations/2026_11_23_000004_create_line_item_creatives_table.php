<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('line_item_creatives', function (Blueprint $table) {
			$table->id();
			$table->foreignId('line_item_id')->constrained('line_items')->cascadeOnDelete();
			$table->foreignId('creative_id')->constrained('creatives')->cascadeOnDelete();
			$table->unsignedInteger('weight')->default(1);
			$table->string('status', 32)->default('active');
			$table->timestamps();

			$table->unique(['line_item_id', 'creative_id']);
			$table->index(['line_item_id', 'status']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('line_item_creatives');
	}
};
