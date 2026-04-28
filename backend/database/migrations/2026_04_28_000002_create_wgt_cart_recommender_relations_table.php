<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('wgt_cart_recommender_relations', function (Blueprint $table) {
            $table->id();
            $table->uuid('site_id');
            $table->foreign('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->unsignedBigInteger('source_product_id');
            $table->foreign('source_product_id')->references('id')->on('wgt_catalog_products')->cascadeOnDelete();
            $table->unsignedBigInteger('related_product_id');
            $table->foreign('related_product_id')->references('id')->on('wgt_catalog_products')->cascadeOnDelete();
            $table->decimal('score', 6, 4)->default(0);
            $table->text('rationale_ua')->nullable();
            $table->text('rationale_en')->nullable();
            $table->string('source', 32);
            $table->timestamp('computed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['site_id', 'source_product_id', 'related_product_id'], 'wgt_rec_rel_uniq');
            $table->index(['site_id', 'source_product_id']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wgt_cart_recommender_relations');
    }
};
