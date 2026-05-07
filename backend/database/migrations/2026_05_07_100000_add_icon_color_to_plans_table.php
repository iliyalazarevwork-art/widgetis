<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('icon', 50)->default('zap')->after('slug');
            $table->string('color', 20)->default('#3B82F6')->after('icon');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['icon', 'color']);
        });
    }
};
