<?php

declare(strict_types=1);

namespace App\Services\Billing\Results;

final readonly class CheckoutSession
{
    /**
     * @param 'GET'|'POST' $method
     * @param array<string, string> $formFields
     */
    private function __construct(
        public string $method,
        public string $url,
        public array $formFields,
        public ?string $providerReference,
    ) {
    }

    public static function redirect(string $url, ?string $providerReference = null): self
    {
        return new self('GET', $url, [], $providerReference);
    }

    /**
     * @param array<string, string> $formFields
     */
    public static function postForm(string $url, array $formFields, ?string $providerReference = null): self
    {
        return new self('POST', $url, $formFields, $providerReference);
    }
}
