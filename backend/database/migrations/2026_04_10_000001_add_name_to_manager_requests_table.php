<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('manager_requests', function (Blueprint $table) {
            $table->string('name', 100)->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('manager_requests', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
