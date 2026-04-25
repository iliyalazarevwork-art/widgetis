<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->uuid('site_key')->unique()->nullable()->after('id');
            $table->json('allowed_origins')->nullable()->after('domain');
        });

        // Backfill site_key for existing rows
        DB::table('sites')->whereNull('site_key')->orderBy('id')->each(function (object $site) {
            DB::table('sites')
                ->where('id', $site->id)
                ->update(['site_key' => (string) Str::uuid7()]);
        });
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['site_key', 'allowed_origins']);
        });
    }
};
