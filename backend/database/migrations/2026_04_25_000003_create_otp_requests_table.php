<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('otp_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained();
            $table->uuid('request_id')->unique(); // public id returned to widget
            $table->string('phone', 20);           // E.164
            $table->string('code_hash');            // bcrypt of 6-digit code
            $table->string('provider', 30);
            $table->string('channel', 10);
            $table->string('status', 20);           // pending|sent|verified|failed|expired
            $table->smallInteger('attempts')->default(0);
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('utm_source', 100)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['site_id', 'phone', 'status']);
            $table->index(['site_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_requests');
    }
};
