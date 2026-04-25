<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('otp_provider_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('site_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30);
            $table->string('channel', 10)->default('sms');
            $table->text('credentials'); // encrypted:array cast on model
            $table->string('sender_name', 30);
            $table->json('templates'); // {"uk":"...","en":"...","ru":"...","pl":"..."}
            $table->boolean('is_active')->default(true);
            $table->smallInteger('priority')->default(0);
            $table->timestamps();

            $table->unique(['site_id', 'provider', 'channel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_provider_configs');
    }
};
