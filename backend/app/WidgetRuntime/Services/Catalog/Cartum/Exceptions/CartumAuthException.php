<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Cartum\Exceptions;

/**
 * Thrown when authentication with the Cartum API fails —
 * missing credentials, decryption failure, or a non-OK /api/auth/ response.
 */
final class CartumAuthException extends CartumException
{
}
