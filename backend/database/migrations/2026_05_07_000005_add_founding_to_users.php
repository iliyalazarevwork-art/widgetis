<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_founding')->default(false)->after('timezone');
            $table->decimal('founding_locked_price_monthly', 10, 2)->nullable()->after('is_founding');
            $table->index('is_founding');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['is_founding']);
            $table->dropColumn(['is_founding', 'founding_locked_price_monthly']);
        });
    }
};
