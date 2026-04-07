<?php

declare(strict_types=1);

use App\Enums\Platform;
use App\Enums\ProductStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->jsonb('name');
            $table->jsonb('description');
            $table->jsonb('long_description')->nullable();
            $table->jsonb('features')->nullable();
            $table->string('icon', 50);
            $table->string('tag_slug', 50)->nullable();
            $table->string('platform', 30)->default(Platform::Horoshop->value);
            $table->string('status', 20)->default(ProductStatus::Active->value);
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_new')->default(false);
            $table->string('preview_before', 500)->nullable();
            $table->string('preview_after', 500)->nullable();
            $table->string('builder_module', 100)->nullable();
            $table->jsonb('config_schema')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('tag_slug')->references('slug')->on('widget_tags')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
