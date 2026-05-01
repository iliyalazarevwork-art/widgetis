<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $isPgsql = Schema::getConnection()->getDriverName() === 'pgsql';

        if ($isPgsql) {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        }

        Schema::create('wgt_smart_search_feeds', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->string('lang', 2);
            $table->string('feed_url', 500);
            $table->string('sitemap_url', 500)->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('sync_started_at')->nullable();
            $table->string('status', 20)->default('idle');
            $table->text('error')->nullable();
            $table->integer('items_count')->default(0);
            $table->timestamps();

            $table->unique(['site_id', 'lang']);
        });

        Schema::create('wgt_smart_search_categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->string('lang', 2);
            $table->string('external_id');
            $table->string('parent_id')->nullable();
            $table->string('name');
            $table->string('url', 1000)->nullable();
            $table->integer('products_count')->default(0);
            $table->timestamps();

            $table->unique(['site_id', 'lang', 'external_id']);
            $table->index(['site_id', 'lang']);
        });

        Schema::create('wgt_smart_search_products', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->string('lang', 2);
            $table->string('external_id');
            $table->string('name', 1000);
            $table->string('vendor')->nullable();
            $table->string('category_id')->nullable();
            $table->string('category_path', 1000)->nullable();
            $table->string('category_name', 1000)->nullable();
            $table->string('picture', 2000)->nullable();
            $table->string('url', 2000);
            $table->integer('price')->nullable();
            $table->integer('oldprice')->default(0);
            $table->string('currency', 8)->default('UAH');
            $table->boolean('available')->default(true);
            $table->text('search_text');
            $table->integer('popularity')->default(0);
            $table->timestamps();

            $table->unique(['site_id', 'lang', 'external_id']);
        });

        if (! $isPgsql) {
            return;
        }

        // Generated tsvector column + GIN/trigram indexes — Postgres-only.
        DB::statement("
            ALTER TABLE wgt_smart_search_products
            ADD COLUMN tsv tsvector
            GENERATED ALWAYS AS (
                to_tsvector('simple',
                    coalesce(name, '') || ' ' ||
                    coalesce(vendor, '') || ' ' ||
                    coalesce(search_text, '')
                )
            ) STORED
        ");

        DB::statement('CREATE INDEX wgt_smart_search_products_tsv_idx ON wgt_smart_search_products USING GIN(tsv)');
        DB::statement('CREATE INDEX wgt_smart_search_products_trgm_idx ON wgt_smart_search_products USING GIN(search_text gin_trgm_ops)');
        DB::statement('CREATE INDEX wgt_smart_search_products_filter_idx ON wgt_smart_search_products(site_id, lang, available)');
        DB::statement('CREATE INDEX wgt_smart_search_products_cat_idx ON wgt_smart_search_products(site_id, lang, category_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('wgt_smart_search_products');
        Schema::dropIfExists('wgt_smart_search_categories');
        Schema::dropIfExists('wgt_smart_search_feeds');
        // NOTE: pg_trgm extension is intentionally NOT dropped — other migrations may rely on it.
    }
};
