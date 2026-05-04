<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        DB::table('plans')->where('slug', 'pro')->update([
            'trial_days' => 14,
        ]);

        DB::table('plans')->where('slug', 'max')->update([
            'price_monthly' => 3990,
            'price_yearly' => 39900,
            'trial_days' => 14,
        ]);
    }

    public function down(): void
    {
        DB::table('plans')->where('slug', 'pro')->update([
            'trial_days' => 7,
        ]);

        DB::table('plans')->where('slug', 'max')->update([
            'price_monthly' => 2899,
            'price_yearly' => 28990,
            'trial_days' => 7,
        ]);
    }
};
