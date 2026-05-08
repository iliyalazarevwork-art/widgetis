<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Exceptions;

use RuntimeException;

/**
 * Thrown when the widget-builder validation service is unreachable, timed
 * out, returned 5xx, or returned a malformed body. Distinct from a normal
 * "config invalid" outcome (which is signalled by
 * WidgetConfigValidationResult::$ok = false). Callers should map this to
 * HTTP 503, not 422 — the request couldn't be evaluated at all.
 */
final class WidgetConfigValidatorUnavailableException extends RuntimeException
{
}
