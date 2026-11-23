<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
	public function up(): void
	{
		Schema::create('vendors', function (Blueprint $table) {
			$table->id();
			$table->string('code', 64)->unique()->comment('Vendor code e.g. VND-GOLDSUN');
			$table->string('name', 255)->comment('Media Owner display name');
			$table->string('company_name', 255)->nullable()->comment('Legal registered entity name');
			$table->string('tax_code', 50)->nullable()->comment('Corporate tax code');
			$table->string('contact_name', 100)->nullable();
			$table->string('contact_email', 100)->nullable();
			$table->string('contact_phone', 20)->nullable();
			$table->string('address', 255)->nullable();
			$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->comment('Linked CMS portal user');
			$table->string('api_key_hash', 64)->nullable()->unique()->comment('SHA-256 hash of partner key');
			$table->string('api_key_prefix', 16)->nullable()->comment('First 12-16 chars for identification e.g. dooh_live_a1b2');
			$table->unsignedInteger('rate_limit_per_minute')->default(120);
			$table->decimal('revenue_share_percentage', 5, 2)->default(70.00);
			$table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
			$table->timestamp('last_active_at')->nullable();
			$table->timestamps();
			$table->softDeletes();

			$table->index('code');
			$table->index('name');
			$table->index('status');
			$table->index('api_key_hash');
		});
	}

	public function down(): void
	{
		Schema::dropIfExists('vendors');
	}
};
