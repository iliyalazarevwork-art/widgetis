<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable()->unique();
            $table->string('password')->nullable();
            $table->string('avatar_url', 500)->nullable();
            $table->string('telegram', 100)->nullable();
            $table->string('company')->nullable();
            $table->string('locale', 2)->default('uk');
            $table->string('timezone', 50)->default('Europe/Kyiv');
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('two_factor_method', 20)->default('email');
            $table->boolean('notification_enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
