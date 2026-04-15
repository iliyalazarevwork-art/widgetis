<?php

declare(strict_types=1);

use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained();
            $table->foreignUuid('order_id')->nullable()->constrained();
            $table->foreignUuid('subscription_id')->nullable()->constrained();
            $table->string('type', 20);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('UAH');
            $table->string('status', 20)->default(PaymentStatus::Pending->value);
            $table->string('payment_provider', 20)->nullable();
            $table->string('payment_method', 50)->nullable();
            $table->string('transaction_id')->nullable();
            $table->jsonb('description')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
