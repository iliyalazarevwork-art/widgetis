<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('wgt_catalog_products', function (Blueprint $table) {
            $table->id();
            $table->uuid('site_id');
            $table->foreign('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->string('sku');
            $table->string('parent_sku')->nullable();
            $table->string('alias')->nullable();
            $table->string('external_url')->nullable();
            $table->string('title_ua')->nullable();
            $table->string('title_en')->nullable();
            $table->string('title_ru')->nullable();
            $table->string('category_path', 1000)->nullable();
            $table->string('brand')->nullable();
            $table->text('description_ua')->nullable();
            $table->text('description_en')->nullable();
            $table->text('short_description_ua')->nullable();
            $table->text('short_description_en')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('old_price', 12, 2)->nullable();
            $table->string('currency', 8)->nullable();
            $table->text('image_url')->nullable();
            $table->jsonb('image_urls')->nullable();
            $table->boolean('in_stock')->default(true);
            $table->jsonb('raw_attributes')->nullable();
            $table->jsonb('ai_tags')->nullable();
            $table->string('source_hash', 64)->nullable();
            $table->timestamp('ai_tagged_at')->nullable();
            $table->timestamp('embedded_at')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'sku']);
            $table->index('sku');
            $table->index('source_hash');
            $table->index(['site_id', 'in_stock']);
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE wgt_catalog_products ADD COLUMN embedding vector(1536) NULL');
            DB::statement('CREATE INDEX wgt_catalog_products_embedding_idx ON wgt_catalog_products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS wgt_catalog_products_embedding_idx');
        }

        Schema::dropIfExists('wgt_catalog_products');
    }
};
