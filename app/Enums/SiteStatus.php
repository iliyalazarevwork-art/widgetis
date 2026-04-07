<?php

declare(strict_types=1);

namespace App\Enums;

enum SiteStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Deactivated = 'deactivated';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Deactivated => 'Deactivated',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Active => 'success',
            self::Deactivated => 'gray',
        };
    }
}
