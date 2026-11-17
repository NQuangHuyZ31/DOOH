<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->comment('Unique venue/screen code');
            $table->string('name', 255)->comment('Screen display name');
            $table->string('location', 255)->nullable()->comment('Physical address');
            $table->unsignedInteger('width')->default(1920)->comment('Width in pixels');
            $table->unsignedInteger('height')->default(1080)->comment('Height in pixels');
            $table->enum('orientation', ['landscape', 'portrait'])->default('landscape');
            $table->string('secret_key', 64)->nullable()->comment('Screen authentication token');
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
