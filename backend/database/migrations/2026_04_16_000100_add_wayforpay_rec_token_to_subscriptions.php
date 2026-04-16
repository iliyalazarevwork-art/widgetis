<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            // Long-lived token returned by WayForPay on a successful Purchase
            // with saveRecToken=1. Used by ChargeRecurringSubscriptions to
            // fire merchant-initiated CHARGE calls against the same card.
            // Mirrors the role of monobank_card_token for Monobank.
            $table->string('wayforpay_rec_token')->nullable()->after('payment_provider_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropColumn('wayforpay_rec_token');
        });
    }
};
