<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Enums\PaymentProvider;

final class CapabilityNotSupportedException extends \DomainException
{
    public static function refunds(PaymentProvider $provider): self
    {
        return new self("Provider {$provider->value} does not support refunds");
    }

    public static function merchantCharge(PaymentProvider $provider): self
    {
        return new self("Provider {$provider->value} does not support merchant-initiated charges");
    }

    public static function planChange(PaymentProvider $provider): self
    {
        return new self("Provider {$provider->value} does not support in-place plan change");
    }
}
