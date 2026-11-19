<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->comment('Unique venue code (e.g. SGN-LM81)');
            $table->string('name', 255)->comment('Venue name');
            $table->string('venue_type', 64)->default('shopping_mall')->comment('Environment type');
            $table->foreignId('media_owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('address', 255)->nullable();
            $table->string('ward', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('city_province', 100)->nullable();
            $table->string('country_code', 2)->default('VN');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->time('opening_time')->default('06:00:00');
            $table->time('closing_time')->default('23:00:00');
            $table->boolean('is_24_7')->default(false);
            $table->unsignedInteger('daily_traffic')->default(0)->comment('Estimated daily footfall / OTS');
            $table->string('contact_name', 100)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('name');
            $table->index('venue_type');
            $table->index('city_province');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
