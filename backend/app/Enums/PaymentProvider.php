<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentProvider: string
{
    case LiqPay = 'liqpay';
    case Monobank = 'monobank';

    public function label(): string
    {
        return match ($this) {
            self::LiqPay => 'LiqPay',
            self::Monobank => 'Monobank',
        };
    }
}
