<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\Events;

final readonly class InvalidSignatureEvent extends PaymentEvent
{
    public function __construct()
    {
        parent::__construct('');
    }
}
