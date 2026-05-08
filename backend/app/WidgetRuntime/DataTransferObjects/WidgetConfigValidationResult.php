<?php

declare(strict_types=1);

namespace App\WidgetRuntime\DataTransferObjects;

/**
 * Outcome of running a demo-session config payload through the per-module
 * Zod schemas exposed by the widget-builder service.
 *
 * Mirrors the JSON shape returned by POST /validate on widget-builder so
 * the controller can pass `errors` through to the API response unchanged
 * — the agent and any human admin both want the exact field path that
 * failed, not a translated/abbreviated message.
 */
final readonly class WidgetConfigValidationResult
{
    /**
     * @param list<string> $validatedModules
     * @param list<array{slug: string, field: string, path: list<string|int>, expected: string, received: string, message: string}> $errors
     */
    public function __construct(
        public bool $ok,
        public array $validatedModules,
        public array $errors,
    ) {
    }

    /**
     * Build from the JSON body returned by `POST /validate` on
     * widget-builder. Defensive: missing keys default to a "service
     * misconfigured" failure so callers cannot accidentally treat a
     * malformed response as success.
     *
     * @param array<string, mixed> $payload
     */
    public static function fromBuilderResponse(array $payload): self
    {
        /** @var list<string> $validated */
        $validated = is_array($payload['validated_modules'] ?? null)
            ? array_values(array_filter(
                $payload['validated_modules'],
                static fn (mixed $v): bool => is_string($v),
            ))
            : [];

        /** @var list<array{slug: string, field: string, path: list<string|int>, expected: string, received: string, message: string}> $errors */
        $errors = is_array($payload['errors'] ?? null)
            ? array_values(array_filter(
                array_map(self::normalizeError(...), $payload['errors']),
                static fn (?array $e): bool => $e !== null,
            ))
            : [];

        return new self(
            ok: ($payload['ok'] ?? false) === true,
            validatedModules: $validated,
            errors: $errors,
        );
    }

    /**
     * @return array{slug: string, field: string, path: list<string|int>, expected: string, received: string, message: string}|null
     */
    private static function normalizeError(mixed $raw): ?array
    {
        if (! is_array($raw)) {
            return null;
        }
        $path = is_array($raw['path'] ?? null)
            ? array_values(array_filter(
                $raw['path'],
                static fn (mixed $v): bool => is_string($v) || is_int($v),
            ))
            : [];

        return [
            'slug' => is_string($raw['slug'] ?? null) ? $raw['slug'] : '',
            'field' => is_string($raw['field'] ?? null) ? $raw['field'] : 'config',
            'path' => $path,
            'expected' => is_string($raw['expected'] ?? null) ? $raw['expected'] : '',
            'received' => is_string($raw['received'] ?? null) ? $raw['received'] : '',
            'message' => is_string($raw['message'] ?? null) ? $raw['message'] : '',
        ];
    }
}
