<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE screens MODIFY COLUMN orientation ENUM('landscape', 'portrait', 'square', 'ribbon', 'custom') NOT NULL DEFAULT 'landscape'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE screens MODIFY COLUMN orientation ENUM('landscape', 'portrait', 'custom') NOT NULL DEFAULT 'landscape'");
        }
    }
};
