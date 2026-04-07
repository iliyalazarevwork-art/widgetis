<?php

declare(strict_types=1);

use App\Enums\BillingPeriod;
use App\Enums\SubscriptionStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained();
            $table->string('billing_period', 10)->default(BillingPeriod::Monthly->value);
            $table->string('status', 20)->default(SubscriptionStatus::Active->value);
            $table->boolean('is_trial')->default(false);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start');
            $table->timestamp('current_period_end');
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->integer('payment_retry_count')->default(0);
            $table->timestamp('next_payment_retry_at')->nullable();
            $table->string('payment_provider', 20)->nullable();
            $table->string('payment_provider_subscription_id')->nullable();
            $table->timestamps();
            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
