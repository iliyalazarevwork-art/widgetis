<?php

declare(strict_types=1);

namespace App\Services\Billing\DTO;

/**
 * Outcome of processing an incoming webhook from a payment provider.
 *
 * $signatureValid distinguishes forged requests (false) from well-signed
 * requests that simply did not match any known order (true but processed=false),
 * so routes can return 401 vs 202 accordingly.
 */
final readonly class WebhookResult
{
    public function __construct(
        public bool $signatureValid,
        public bool $processed,
        public ?string $reference = null,
        public ?string $providerStatus = null,
    ) {
    }

    public static function invalidSignature(): self
    {
        return new self(signatureValid: false, processed: false);
    }

    public static function processed(?string $reference, ?string $providerStatus): self
    {
        return new self(signatureValid: true, processed: true, reference: $reference, providerStatus: $providerStatus);
    }

    public static function ignored(?string $reference = null, ?string $providerStatus = null): self
    {
        return new self(signatureValid: true, processed: false, reference: $reference, providerStatus: $providerStatus);
    }
}
