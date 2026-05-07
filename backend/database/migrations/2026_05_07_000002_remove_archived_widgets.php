<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    private const SLUGS = [
        'recently-viewed',
        'floating-messengers',
    ];

    public function up(): void
    {
        $productIds = DB::table('products')
            ->whereIn('slug', self::SLUGS)
            ->pluck('id')
            ->all();

        if (empty($productIds)) {
            return;
        }

        // Delete dependent rows in product_plan_access
        DB::table('product_plan_access')
            ->whereIn('product_id', $productIds)
            ->delete();

        // Delete dependent rows in wgt_site_widgets (runtime DB)
        DB::connection('pgsql_runtime')
            ->table('wgt_site_widgets')
            ->whereIn('product_id', $productIds)
            ->delete();

        // Delete dependent rows in wgt_user_widget_grants (runtime DB)
        DB::connection('pgsql_runtime')
            ->table('wgt_user_widget_grants')
            ->whereIn('product_id', $productIds)
            ->delete();

        // Finally hard-delete the products themselves
        DB::table('products')
            ->whereIn('id', $productIds)
            ->delete();
    }

    public function down(): void
    {
        // Irreversible cleanup — no rollback
    }
};
