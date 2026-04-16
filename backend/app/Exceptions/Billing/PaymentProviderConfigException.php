<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use RuntimeException;

/**
 * Thrown when a payment provider is not fully configured
 * (missing API key, webhook URL, etc.).
 */
class PaymentProviderConfigException extends RuntimeException
{
    public static function monobank(): self
    {
        return new self(
            'Monobank provider is not fully configured (MONOBANK_TOKEN / MONOBANK_REDIRECT_URL / MONOBANK_WEBHOOK_URL).'
        );
    }

    public static function wayForPay(): self
    {
        return new self(
            'WayForPay provider is not fully configured (WAYFORPAY_MERCHANT_ACCOUNT / WAYFORPAY_SECRET_KEY).'
        );
    }
}
