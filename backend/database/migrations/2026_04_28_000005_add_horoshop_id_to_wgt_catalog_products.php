<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('wgt_catalog_products', function (Blueprint $table) {
            $table->bigInteger('horoshop_id')->nullable()->after('alias');
            $table->index('horoshop_id');
        });
    }

    public function down(): void
    {
        Schema::table('wgt_catalog_products', function (Blueprint $table) {
            $table->dropIndex(['horoshop_id']);
            $table->dropColumn('horoshop_id');
        });
    }
};
