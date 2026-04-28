<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Cartum\Exceptions;

/**
 * Base exception for all Cartum API errors.
 *
 * Kept open (not final) so subclasses can be raised and caught
 * individually by callers who need finer-grained handling.
 */
class CartumException extends \RuntimeException
{
}
