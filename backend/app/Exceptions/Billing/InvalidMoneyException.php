<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

final class InvalidMoneyException extends \DomainException
{
    public static function negativeAmount(int $amount): self
    {
        return new self("Money amount must be non-negative, got {$amount}.");
    }
}
