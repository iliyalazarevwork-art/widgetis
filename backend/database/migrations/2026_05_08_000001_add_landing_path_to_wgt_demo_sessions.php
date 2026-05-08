<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Use the default connection — same pattern as the original CREATE
        // (0001_01_01_000023) and the RENAME-to-wgt-prefix migration. In
        // production `pgsql` and `pgsql_runtime` map to the same physical
        // DB; in test (sqlite :memory:) each connection has its own DB,
        // so altering on `pgsql_runtime` here would miss the table that
        // was created on the default connection.
        Schema::table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->string('landing_path', 2048)->nullable()->after('domain');
        });
    }

    public function down(): void
    {
        Schema::table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->dropColumn('landing_path');
        });
    }
};
