<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Exceptions;

/**
 * Thrown when the OpenAI embedding call fails with a non-retryable error.
 */
final class EmbeddingException extends \RuntimeException
{
}
