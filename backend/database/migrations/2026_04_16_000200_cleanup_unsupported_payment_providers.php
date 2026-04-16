<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        $activeProviders = ['monobank', 'wayforpay'];

        DB::table('orders')
            ->whereNotNull('payment_provider')
            ->whereNotIn('payment_provider', $activeProviders)
            ->update(['payment_provider' => null]);

        DB::table('payments')
            ->whereNotNull('payment_provider')
            ->whereNotIn('payment_provider', $activeProviders)
            ->update(['payment_provider' => null]);

        DB::table('subscriptions')
            ->whereNotNull('payment_provider')
            ->whereNotIn('payment_provider', $activeProviders)
            ->update([
                'payment_provider' => null,
                'payment_provider_subscription_id' => null,
            ]);
    }

    public function down(): void
    {
        // Provider cleanup only.
    }
};
