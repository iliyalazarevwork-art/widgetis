<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop all FK constraints from wgt_* tables that reference Core-domain tables
 * (users, products). These constraints were the database-level expression of
 * the cross-context coupling that has now been removed at the code level.
 *
 * After this migration, referential integrity across context boundaries is
 * enforced by application logic (SiteOwnershipInterface, WidgetCatalogInterface)
 * rather than by the database engine.
 */
return new class () extends Migration {
    protected $connection = 'pgsql_runtime';

    public function up(): void
    {
        // SQLite (used in unit tests) does not support dropping FK constraints by name.
        if (Schema::connection('pgsql_runtime')->getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        // wgt_sites.user_id → users
        Schema::connection('pgsql_runtime')->table('wgt_sites', function (Blueprint $table): void {
            $table->dropForeign('sites_user_id_foreign');
        });

        // wgt_site_widgets.product_id → products
        Schema::connection('pgsql_runtime')->table('wgt_site_widgets', function (Blueprint $table): void {
            $table->dropForeign('site_widgets_product_id_foreign');
        });

        // wgt_reviews.user_id → users
        Schema::connection('pgsql_runtime')->table('wgt_reviews', function (Blueprint $table): void {
            $table->dropForeign('reviews_user_id_foreign');
        });

        // wgt_demo_sessions.created_by → users
        Schema::connection('pgsql_runtime')->table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->dropForeign('demo_sessions_created_by_foreign');
        });

        // wgt_user_widget_grants.user_id → users
        // wgt_user_widget_grants.product_id → products
        // wgt_user_widget_grants.granted_by_admin_id → users
        Schema::connection('pgsql_runtime')->table('wgt_user_widget_grants', function (Blueprint $table): void {
            $table->dropForeign('user_widget_grants_user_id_foreign');
            $table->dropForeign('user_widget_grants_product_id_foreign');
            $table->dropForeign('user_widget_grants_granted_by_admin_id_foreign');
        });
    }

    public function down(): void
    {
        if (Schema::connection('pgsql_runtime')->getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        // Restore the FK constraints on rollback.
        // Note: this assumes the referenced rows still exist.

        Schema::connection('pgsql_runtime')->table('wgt_sites', function (Blueprint $table): void {
            $table->foreign('user_id', 'sites_user_id_foreign')
                ->references('id')->on('users')->onDelete('cascade');
        });

        Schema::connection('pgsql_runtime')->table('wgt_site_widgets', function (Blueprint $table): void {
            $table->foreign('product_id', 'site_widgets_product_id_foreign')
                ->references('id')->on('products')->onDelete('cascade');
        });

        Schema::connection('pgsql_runtime')->table('wgt_reviews', function (Blueprint $table): void {
            $table->foreign('user_id', 'reviews_user_id_foreign')
                ->references('id')->on('users')->onDelete('cascade');
        });

        Schema::connection('pgsql_runtime')->table('wgt_demo_sessions', function (Blueprint $table): void {
            $table->foreign('created_by', 'demo_sessions_created_by_foreign')
                ->references('id')->on('users')->onDelete('set null');
        });

        Schema::connection('pgsql_runtime')->table('wgt_user_widget_grants', function (Blueprint $table): void {
            $table->foreign('user_id', 'user_widget_grants_user_id_foreign')
                ->references('id')->on('users')->onDelete('cascade');
            $table->foreign('product_id', 'user_widget_grants_product_id_foreign')
                ->references('id')->on('products')->onDelete('cascade');
            $table->foreign('granted_by_admin_id', 'user_widget_grants_granted_by_admin_id_foreign')
                ->references('id')->on('users')->onDelete('set null');
        });
    }
};
