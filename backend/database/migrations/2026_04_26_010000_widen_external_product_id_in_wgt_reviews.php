<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $driver = Schema::connection('pgsql_runtime')->getConnection()->getDriverName();

        if ($driver !== 'pgsql') {
            return;
        }

        DB::connection('pgsql_runtime')->statement(
            'ALTER TABLE wgt_reviews ALTER COLUMN external_product_id TYPE varchar(200)'
        );
    }

    public function down(): void
    {
        $driver = Schema::connection('pgsql_runtime')->getConnection()->getDriverName();

        if ($driver !== 'pgsql') {
            return;
        }

        DB::connection('pgsql_runtime')->statement(
            'ALTER TABLE wgt_reviews ALTER COLUMN external_product_id TYPE varchar(64)'
        );
    }
};
