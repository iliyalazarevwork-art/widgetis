<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Bridge;

use App\Shared\Contracts\WidgetConfigValidatorInterface;
use App\WidgetRuntime\DataTransferObjects\WidgetConfigValidationResult;
use App\WidgetRuntime\Exceptions\WidgetConfigValidatorUnavailableException;

/**
 * Calls the widget-builder service over HTTP to validate a demo-session
 * config payload against the real Zod schemas of each widget module.
 *
 * Fail-closed: if widget-builder is unreachable, returns 5xx, or returns a
 * malformed response, this throws WidgetConfigValidatorUnavailableException
 * so the calling controller can surface a 503. We never silently accept an
 * unvalidated payload — that defeats the point of having the check.
 */
final readonly class HttpWidgetConfigValidator implements WidgetConfigValidatorInterface
{
    public function __construct(
        private string $baseUrl,
        private int $timeoutSeconds,
    ) {
    }

    public function validate(array $payload): WidgetConfigValidationResult
    {
        $url = rtrim($this->baseUrl, '/').'/validate';
        $body = (string) json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
            CURLOPT_CONNECTTIMEOUT => max(1, (int) ($this->timeoutSeconds / 2)),
        ]);

        $response = curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError !== '') {
            throw new WidgetConfigValidatorUnavailableException(
                "widget-builder unreachable: {$curlError}",
            );
        }

        if ($httpStatus >= 500) {
            throw new WidgetConfigValidatorUnavailableException(
                "widget-builder /validate returned HTTP {$httpStatus}",
            );
        }

        if (! is_string($response) || $response === '') {
            throw new WidgetConfigValidatorUnavailableException(
                'widget-builder /validate returned an empty body',
            );
        }

        /** @var mixed $decoded */
        $decoded = json_decode($response, true);
        if (! is_array($decoded)) {
            throw new WidgetConfigValidatorUnavailableException(
                'widget-builder /validate returned non-JSON body',
            );
        }

        // 400 from /validate means the payload was structurally bad (not
        // valid JSON, or `modules` was not an object). We surface that as
        // a single synthetic error so callers can still 422 with detail.
        if ($httpStatus === 400) {
            return new WidgetConfigValidationResult(
                ok: false,
                validatedModules: [],
                errors: [[
                    'slug' => '',
                    'field' => 'config',
                    'path' => [],
                    'expected' => 'object with "modules"',
                    'received' => 'malformed',
                    'message' => is_string($decoded['error'] ?? null) ? $decoded['error'] : 'malformed payload',
                ]],
            );
        }

        return WidgetConfigValidationResult::fromBuilderResponse($decoded);
    }
}
