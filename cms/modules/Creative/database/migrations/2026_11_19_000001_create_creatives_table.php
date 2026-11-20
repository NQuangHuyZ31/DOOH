<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('creatives', function (Blueprint $table) {
			$table->id();
			$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
			$table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
			$table->timestamp('approved_at')->nullable();
			$table->string('name');
			$table->string('code', 64)->unique();
			$table->string('type', 32)->default('video')->index();
			$table->string('status', 32)->default('pending_review')->index();
			$table->text('media_url');
			$table->text('thumbnail_url')->nullable();
			$table->unsignedInteger('width')->default(1920);
			$table->unsignedInteger('height')->default(1080);
			$table->string('aspect_ratio', 32)->default('16:9');
			$table->unsignedInteger('duration_seconds')->nullable()->default(null);
			$table->unsignedBigInteger('file_size_bytes')->nullable();
			$table->string('mime_type', 100)->nullable();
			$table->text('rejection_reason')->nullable();
			$table->json('metadata')->nullable();
			$table->timestamps();
			$table->softDeletes();
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('creatives');
	}
};
