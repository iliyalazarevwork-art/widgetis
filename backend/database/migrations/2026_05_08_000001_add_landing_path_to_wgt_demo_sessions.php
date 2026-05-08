<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql_runtime')->table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->string('landing_path', 2048)->nullable()->after('domain');
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_runtime')->table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->dropColumn('landing_path');
        });
    }
};
