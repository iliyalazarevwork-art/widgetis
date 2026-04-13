<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Monobank tokenises cards into a merchant-scoped "wallet" keyed by an
 * arbitrary merchant-chosen UUID (walletId). On the first successful
 * charge Mono returns a walletId+cardToken pair which we persist so
 * subsequent recurring charges can be made against /wallet/payment
 * without re-prompting the user for card details.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('monobank_wallet_id')->nullable()->after('remember_token');
            $table->index('monobank_wallet_id');
        });

        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->string('monobank_card_token')->nullable()->after('payment_provider_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            $table->dropColumn('monobank_card_token');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['monobank_wallet_id']);
            $table->dropColumn('monobank_wallet_id');
        });
    }
};
