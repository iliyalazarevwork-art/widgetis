<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained();
            $table->string('action', 100);
            $table->string('entity_type', 50)->nullable();
            $table->string('entity_id', 36)->nullable();
            $table->jsonb('description')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamp('created_at');
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
    }
};
