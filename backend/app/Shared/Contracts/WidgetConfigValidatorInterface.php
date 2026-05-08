<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

use App\WidgetRuntime\DataTransferObjects\WidgetConfigValidationResult;

interface WidgetConfigValidatorInterface
{
    /**
     * Validate a demo-session config payload (the inner `config` block from
     * POST /api/v1/admin/demo-sessions, or the full request body — peeling
     * is implementation-defined). Implementations run the payload against
     * the real Zod schemas exported from each widget-builder module schema
     * (widget-builder/modules/module-{slug}/schema.ts) and return a
     * structured result that callers can surface as 422 errors.
     *
     * @param array<string, mixed> $payload
     */
    public function validate(array $payload): WidgetConfigValidationResult;
}
