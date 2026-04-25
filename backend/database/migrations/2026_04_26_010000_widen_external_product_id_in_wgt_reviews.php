<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $driver = Schema::connection('pgsql_runtime')->getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::connection('pgsql_runtime')->statement(
                'ALTER TABLE wgt_reviews ALTER COLUMN external_product_id TYPE varchar(200)'
            );

            return;
        }

        Schema::connection('pgsql_runtime')->table('wgt_reviews', function ($table) {
            $table->string('external_product_id', 200)->nullable()->change();
        });
    }

    public function down(): void
    {
        $driver = Schema::connection('pgsql_runtime')->getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::connection('pgsql_runtime')->statement(
                'ALTER TABLE wgt_reviews ALTER COLUMN external_product_id TYPE varchar(64)'
            );

            return;
        }

        Schema::connection('pgsql_runtime')->table('wgt_reviews', function ($table) {
            $table->string('external_product_id', 64)->nullable()->change();
        });
    }
};
