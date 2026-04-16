<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

final class InvalidCustomerProfileException extends \DomainException
{
    public static function emptyPhone(): self
    {
        return new self('Customer phone number is required and cannot be empty after normalisation.');
    }
}
