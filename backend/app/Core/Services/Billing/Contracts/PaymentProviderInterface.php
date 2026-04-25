<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Contracts;

use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Events\PaymentEvent;
use App\Core\Services\Billing\Results\CancellationResult;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Enums\PaymentProvider;

interface PaymentProviderInterface
{
    public function name(): PaymentProvider;

    public function capabilities(): ProviderCapabilities;

    public function startSubscription(StartSubscriptionCommand $command): CheckoutSession;

    public function cancelSubscription(CancelSubscriptionCommand $command): CancellationResult;

    public function parseWebhook(InboundWebhook $webhook): PaymentEvent;
}
