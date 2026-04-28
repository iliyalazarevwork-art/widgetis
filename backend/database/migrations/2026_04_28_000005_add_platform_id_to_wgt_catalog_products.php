<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql_runtime')->table('wgt_catalog_products', function (Blueprint $table) {
            $table->bigInteger('platform_id')->nullable()->after('alias');
            $table->index('platform_id');
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_runtime')->table('wgt_catalog_products', function (Blueprint $table) {
            $table->dropColumn('platform_id');
        });
    }
};
