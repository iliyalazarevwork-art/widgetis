<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentType: string
{
    case Charge = 'charge';
    case Refund = 'refund';
    case TrialActivation = 'trial_activation';

    public function label(): string
    {
        return match ($this) {
            self::Charge => 'Charge',
            self::Refund => 'Refund',
            self::TrialActivation => 'Trial Activation',
        };
    }
}
