<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('plan_features', function (Blueprint $table) {
            $table->id();
            $table->string('feature_key', 100);
            $table->jsonb('name');
            $table->string('category', 50);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('plan_feature_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_feature_id')->constrained()->cascadeOnDelete();
            $table->jsonb('value');
            $table->unique(['plan_id', 'plan_feature_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_feature_values');
        Schema::dropIfExists('plan_features');
    }
};
