<?php

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Trial = 'trial';
    case PastDue = 'past_due';
    case Cancelled = 'cancelled';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Active => 'Active',
            self::Trial => 'Trial',
            self::PastDue => 'Past Due',
            self::Cancelled => 'Cancelled',
            self::Expired => 'Expired',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'warning',
            self::Active => 'success',
            self::Trial => 'info',
            self::PastDue => 'warning',
            self::Cancelled => 'gray',
            self::Expired => 'danger',
        };
    }

    /**
     * Statuses that grant the user access to their plan features.
     *
     * @return list<self>
     */
    public static function accessGranting(): array
    {
        return [self::Active, self::Trial];
    }
}
