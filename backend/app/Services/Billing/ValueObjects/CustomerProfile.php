<?php

declare(strict_types=1);

namespace App\Services\Billing\ValueObjects;

use App\Models\User;

final readonly class CustomerProfile
{
    private function __construct(
        public string $email,
        public string $phone,
        public string $firstName,
        public string $lastName,
        public string $locale,
    ) {
    }

    public static function fromUser(User $user, string $locale): self
    {
        $name = $user->name ?? '';
        $parts = preg_split('/\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY);

        $firstName = (count($parts) >= 1) ? $parts[0] : 'Customer';
        $lastName = (count($parts) >= 2) ? $parts[count($parts) - 1] : 'Widgetis';

        $rawPhone = $user->phone ?? '';
        $phone = (string) preg_replace('/\D/', '', $rawPhone);

        // Anonymised fallback for legacy users with no phone
        if ($phone === '') {
            $phone = '380000000000';
        }

        return new self(
            email: $user->email,
            phone: $phone,
            firstName: $firstName,
            lastName: $lastName,
            locale: $locale,
        );
    }

    public static function of(
        string $email,
        string $phone,
        string $firstName,
        string $lastName,
        string $locale,
    ): self {
        $normalised = (string) preg_replace('/\D/', '', $phone);

        if ($normalised === '') {
            $normalised = '380000000000';
        }

        return new self(
            email: $email,
            phone: $normalised,
            firstName: $firstName,
            lastName: $lastName,
            locale: $locale,
        );
    }
}
