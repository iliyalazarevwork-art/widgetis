<?php

declare(strict_types=1);

namespace App\Services\Billing\DTO;

/**
 * Result of creating a checkout session on a payment provider.
 *
 * Some providers (Monobank) return a plain URL the client is redirected to
 * via GET. Others (LiqPay) require a POST form submission with signed data.
 * The caller inspects $method to decide how to hand the payload to the user.
 */
final readonly class CheckoutResult
{
    /**
     * @param 'GET'|'POST' $method
     * @param array<string, string> $formFields
     */
    public function __construct(
        public string $method,
        public string $url,
        public array $formFields = [],
        public ?string $providerReference = null,
    ) {
    }

    /**
     * @param array<string, string> $formFields
     */
    public static function postForm(string $url, array $formFields, ?string $providerReference = null): self
    {
        return new self('POST', $url, $formFields, $providerReference);
    }

    public static function redirect(string $url, ?string $providerReference = null): self
    {
        return new self('GET', $url, [], $providerReference);
    }
}
