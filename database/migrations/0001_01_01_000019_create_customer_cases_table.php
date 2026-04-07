<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('customer_cases', function (Blueprint $table) {
            $table->id();
            $table->string('store');
            $table->string('store_url', 500);
            $table->string('store_logo_url', 500)->nullable();
            $table->string('owner')->nullable();
            $table->string('platform', 30)->nullable();
            $table->jsonb('description')->nullable();
            $table->text('review_text')->nullable();
            $table->smallInteger('review_rating')->nullable();
            $table->jsonb('screenshot_urls')->nullable();
            $table->jsonb('widgets')->nullable();
            $table->boolean('is_published')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_cases');
    }
};
