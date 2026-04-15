<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('site_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->jsonb('config')->nullable();
            $table->timestamp('enabled_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->timestamps();
            $table->unique(['site_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_widgets');
    }
};
