<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql_runtime')->create('wgt_one_plus_one_promos', function (Blueprint $table) {
            $table->id();
            $table->uuid('site_id');
            $table->foreign('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();

            $table->string('name', 100);
            $table->boolean('is_active')->default(true);

            $table->string('catalog_url', 500);
            $table->string('catalog_format', 10)->default('xlsx');

            // null = all categories; ["Чоловікам/Худі чоловічі"] = specific paths
            $table->jsonb('categories')->nullable();

            // { "originalArticle": "cloneArticle" } — built from catalog by suffix
            $table->jsonb('product_map')->default('{}');

            // { "article": "category/path" } — used when cart items lack category
            $table->jsonb('article_categories')->nullable();

            $table->string('article_suffix', 20)->default('-1uah');
            $table->unsignedSmallInteger('min_items')->default(3);
            $table->decimal('one_uah_price', 10, 2)->default(1.00);

            $table->jsonb('settings')->nullable();

            $table->timestamps();

            $table->unique('site_id');
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_runtime')->dropIfExists('wgt_one_plus_one_promos');
    }
};
