<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Exceptions;

/**
 * Thrown when the AI tagger fails to produce a usable response.
 *
 * Subclassed by TaggerRefusalException for the specific case of an empty/
 * refused completion. Kept open (not final) so callers can catch the parent
 * type while the more specific subclass can be raised by the service.
 */
class TaggerException extends \RuntimeException
{
}
