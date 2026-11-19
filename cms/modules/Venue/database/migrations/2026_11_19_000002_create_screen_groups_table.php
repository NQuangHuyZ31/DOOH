<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screen_groups', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->comment('Group code e.g. GRP-CBD-ALL');
            $table->string('name', 255)->comment('Group display name');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('screen_group_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('screen_group_id')->constrained('screen_groups')->cascadeOnDelete();
            $table->foreignId('screen_id')->constrained('screens')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['screen_group_id', 'screen_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screen_group_items');
        Schema::dropIfExists('screen_groups');
    }
};
