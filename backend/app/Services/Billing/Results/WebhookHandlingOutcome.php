<?php

declare(strict_types=1);

namespace App\Services\Billing\Results;

final readonly class WebhookHandlingOutcome
{
    public function __construct(
        public bool $signatureValid,
        public bool $processed,
        public ?string $reference,
        public string $event,
    ) {
    }
}
