<?php

declare(strict_types=1);

namespace App\Services\Billing\ValueObjects;

enum Currency: string
{
    case UAH = 'UAH';
    case USD = 'USD';
    case EUR = 'EUR';

    public function minorUnits(): int
    {
        return 100;
    }
}
