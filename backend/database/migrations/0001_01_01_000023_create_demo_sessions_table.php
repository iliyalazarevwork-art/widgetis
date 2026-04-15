<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('demo_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->string('domain');
            $table->jsonb('config');
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->integer('view_count')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_sessions');
    }
};
