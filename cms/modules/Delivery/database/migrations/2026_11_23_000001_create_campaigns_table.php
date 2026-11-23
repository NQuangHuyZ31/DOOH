<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('campaigns', function (Blueprint $table) {
			$table->id();
			$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
			$table->string('code', 64)->unique();
			$table->string('name');
			$table->text('description')->nullable();
			$table->decimal('total_budget', 15, 2)->nullable();
			$table->date('start_date');
			$table->date('end_date');
			$table->string('status', 32)->default('active')->index();
			$table->timestamps();
			$table->softDeletes();

			$table->index(['status', 'start_date', 'end_date']);
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('campaigns');
	}
};
