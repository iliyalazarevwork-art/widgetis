<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentProvider: string
{
    case Monobank = 'monobank';
    case WayForPay = 'wayforpay';

    public function label(): string
    {
        return match ($this) {
            self::Monobank => 'Monobank',
            self::WayForPay => 'WayForPay',
        };
    }
}
