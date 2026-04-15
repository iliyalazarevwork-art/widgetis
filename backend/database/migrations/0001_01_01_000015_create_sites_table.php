<?php

declare(strict_types=1);

use App\Enums\Platform;
use App\Enums\SiteStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('domain');
            $table->string('url', 500);
            $table->string('platform', 30)->default(Platform::Horoshop->value);
            $table->string('status', 20)->default(SiteStatus::Pending->value);
            $table->boolean('script_installed')->default(false);
            $table->timestamp('script_installed_at')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
            $table->unique(['domain', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
