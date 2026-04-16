<?php

declare(strict_types=1);

namespace App\Exceptions\Billing;

final class InvalidCallbackUrlException extends \DomainException
{
    public static function notHttps(string $url): self
    {
        return new self("Callback URL must start with http:// or https://, got: \"{$url}\".");
    }
}
