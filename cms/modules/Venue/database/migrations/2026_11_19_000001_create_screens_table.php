<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained('venues')->cascadeOnDelete();
            $table->string('code', 64)->unique()->comment('Unique screen code (e.g. SCR-SGN-LM81-01)');
            $table->string('name', 255)->comment('Screen display name');
            $table->string('sub_location', 255)->nullable()->comment('Physical placement within venue');
            $table->string('screen_type', 64)->default('outdoor_led')->comment('Display hardware category');
            $table->unsignedInteger('resolution_width')->default(1920);
            $table->unsignedInteger('resolution_height')->default(1080);
            $table->enum('orientation', ['landscape', 'portrait', 'square', 'ribbon', 'custom'])->default('landscape');
            $table->string('aspect_ratio', 16)->default('16:9');
            $table->decimal('physical_width_m', 6, 2)->nullable();
            $table->decimal('physical_height_m', 6, 2)->nullable();
            $table->decimal('pixel_pitch_mm', 4, 1)->nullable();
            $table->unsignedInteger('brightness_nits')->nullable();
            $table->boolean('has_audio')->default(false);
            $table->unsignedInteger('loop_duration_seconds')->default(120);
            $table->unsignedInteger('default_slot_seconds')->default(15);
            $table->string('hardware_device_uid', 128)->nullable()->comment('Device MAC or Android Box Serial');
            $table->string('secret_key', 64)->nullable()->comment('HMAC screen token');
            $table->enum('connectivity_status', ['online', 'offline', 'degraded'])->default('offline');
            $table->timestamp('last_heartbeat_at')->nullable();
            $table->string('player_app_version', 32)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->unsignedInteger('storage_free_mb')->nullable();
            $table->enum('status', ['active', 'inactive', 'maintenance'])->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('venue_id');
            $table->index('code');
            $table->index('screen_type');
            $table->index('orientation');
            $table->index('connectivity_status');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screens');
    }
};
