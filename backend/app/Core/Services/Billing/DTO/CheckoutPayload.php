<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\DTO;

use App\Core\Services\Billing\Results\CheckoutSession;
use App\Enums\PaymentProvider;

/**
 * Complete checkout payload returned to the frontend.
 *
 * Wraps the provider's CheckoutSession with the order reference and
 * optional upgrade pricing so the controller can serialize the response
 * in one shot without constructing the array manually.
 */
final readonly class CheckoutPayload
{
    /**
     * @param array<string, string> $formFields
     */
    public function __construct(
        public PaymentProvider $provider,
        public string $reference,
        public string $method,
        public string $url,
        public array $formFields,
        public ?string $providerReference,
        public ?float $amountDue = null,
        public ?int $creditApplied = null,
    ) {
    }

    public static function fromCheckoutSession(
        CheckoutSession $session,
        PaymentProvider $provider,
        string $reference,
        ?float $amountDue = null,
        ?int $creditApplied = null,
    ): self {
        return new self(
            provider: $provider,
            reference: $reference,
            method: $session->method,
            url: $session->url,
            formFields: $session->formFields,
            providerReference: $session->providerReference,
            amountDue: $amountDue,
            creditApplied: $creditApplied,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toResponseArray(): array
    {
        $data = [
            'provider' => $this->provider->value,
            'reference' => $this->reference,
            'method' => $this->method,
            'url' => $this->url,
            'form_fields' => (object) $this->formFields,
            'provider_reference' => $this->providerReference,
        ];

        if ($this->amountDue !== null) {
            $data['amount_due'] = $this->amountDue;
        }

        if ($this->creditApplied !== null) {
            $data['credit_applied'] = $this->creditApplied;
        }

        return $data;
    }
}
