<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('wgt_cart_recommender_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('site_id');
            $table->foreign('site_id')->references('id')->on('wgt_sites')->cascadeOnDelete();
            $table->unsignedBigInteger('source_product_id');
            $table->foreign('source_product_id')->references('id')->on('wgt_catalog_products')->cascadeOnDelete();
            $table->unsignedBigInteger('related_product_id');
            $table->foreign('related_product_id')->references('id')->on('wgt_catalog_products')->cascadeOnDelete();
            $table->string('event_type', 16);
            $table->string('lifecycle_token', 64)->nullable();
            $table->timestamp('occurred_at');
            $table->timestamp('created_at')->useCurrent();

            $table->index('occurred_at');
            $table->index(['site_id', 'source_product_id', 'event_type', 'occurred_at'], 'wgt_rec_evt_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wgt_cart_recommender_events');
    }
};
