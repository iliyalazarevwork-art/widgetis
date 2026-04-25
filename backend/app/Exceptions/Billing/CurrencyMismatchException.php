<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

use App\Core\Services\Billing\ValueObjects\Currency;

final class CurrencyMismatchException extends \DomainException
{
    public static function between(Currency $a, Currency $b): self
    {
        return new self("Cannot mix currencies: {$a->value} and {$b->value}.");
    }
}
