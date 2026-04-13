<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\PaymentProvider;
use RuntimeException;

final class UnknownPaymentProviderException extends RuntimeException
{
    public static function notRegistered(PaymentProvider $provider): self
    {
        return new self("Payment provider [{$provider->value}] is not registered.");
    }

    public static function subscriptionHasNoProvider(int $subscriptionId): self
    {
        return new self("Subscription #{$subscriptionId} has no payment_provider set.");
    }
}
