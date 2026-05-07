<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_founding')->default(false)->after('timezone');
            $table->decimal('founding_locked_price_monthly', 10, 2)->nullable()->after('is_founding');
        });

        DB::statement('CREATE INDEX idx_users_is_founding ON users (id) WHERE is_founding = true');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_users_is_founding');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['is_founding', 'founding_locked_price_monthly']);
        });
    }
};
