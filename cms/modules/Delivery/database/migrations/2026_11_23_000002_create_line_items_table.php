<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('line_items', function (Blueprint $table) {
			$table->id();
			$table->foreignId('campaign_id')->constrained('campaigns')->cascadeOnDelete();
			$table->foreignId('creative_id')->nullable()->constrained('creatives')->nullOnDelete();
			$table->string('code', 64)->unique();
			$table->string('name');
			$table->unsignedTinyInteger('priority')->default(5);
			$table->string('pacing_mode', 32)->default('evenly');
			$table->date('start_date');
			$table->date('end_date');
			$table->unsignedBigInteger('target_impressions')->default(10000);
			$table->unsignedInteger('daily_impression_cap')->default(1000);
			$table->string('status', 32)->default('active')->index();
			$table->timestamps();
			$table->softDeletes();

			$table->index(['campaign_id', 'status']);
			$table->index(['status', 'start_date', 'end_date']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('line_items');
	}
};
