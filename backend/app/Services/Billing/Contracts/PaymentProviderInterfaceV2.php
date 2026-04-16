<?php

declare(strict_types=1);

namespace App\Services\Billing\Contracts;

use App\Enums\PaymentProvider;
use App\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Services\Billing\Commands\StartSubscriptionCommand;
use App\Services\Billing\Events\PaymentEvent;
use App\Services\Billing\Results\CancellationResult;
use App\Services\Billing\Results\CheckoutSession;
use App\Services\Billing\Webhooks\InboundWebhook;

interface PaymentProviderInterfaceV2
{
    public function name(): PaymentProvider;

    public function capabilities(): ProviderCapabilities;

    public function startSubscription(StartSubscriptionCommand $command): CheckoutSession;

    public function cancelSubscription(CancelSubscriptionCommand $command): CancellationResult;

    public function parseWebhook(InboundWebhook $webhook): PaymentEvent;
}
