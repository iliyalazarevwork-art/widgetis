<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

final class MalformedWebhookException extends \DomainException
{
    public static function invalidJson(string $reason): self
    {
        return new self("Webhook body is not valid JSON: {$reason}");
    }
}
