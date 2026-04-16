<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class LogApiRequests
{
    /** @var list<string> */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'access_token',
        'refresh_token',
        'magic_token',
        'otp',
        'code',
        'signature',
        'authorization',
        'card_token',
        'monobank_card_token',
        'wayforpay_rec_token',
        'cvv',
        'cvc',
        'pan',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $requestId = (string) Str::uuid();
        $baseContext = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'path' => $request->path(),
            'url' => $request->fullUrl(),
            'route' => $request->route()?->uri(),
            'route_name' => $request->route()?->getName(),
            'controller_action' => $request->route()?->getActionName(),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        Log::channel('api')->info('api.request.in', array_merge($baseContext, [
            'input' => $this->sanitizeValue($request->all()),
        ]));

        try {
            $response = $next($request);
        } catch (\Throwable $exception) {
            $duration = round((microtime(true) - $start) * 1000, 2);
            $status = $exception instanceof HttpExceptionInterface
                ? $exception->getStatusCode()
                : 500;
            Log::channel('api')->error('api.request.out', array_merge($baseContext, [
                'status' => $status,
                'duration_ms' => $duration,
                'exception_class' => $exception::class,
                'exception_message' => $exception->getMessage(),
            ]));

            throw $exception;
        }

        $duration = round((microtime(true) - $start) * 1000, 2);
        $response->headers->set('X-Request-Id', $requestId);

        Log::channel('api')->info('api.request.out', array_merge($baseContext, [
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'response_content_type' => $response->headers->get('Content-Type'),
        ]));

        return $response;
    }

    /**
     * @return mixed
     */
    private function sanitizeValue(mixed $value, ?string $key = null): mixed
    {
        if ($key !== null && $this->isSensitiveKey($key)) {
            return '[REDACTED]';
        }

        if (! is_array($value)) {
            if (is_string($value) && Str::length($value) > 1000) {
                return Str::substr($value, 0, 1000) . '...';
            }

            return $value;
        }

        $sanitized = [];

        foreach ($value as $itemKey => $itemValue) {
            $itemKeyString = is_string($itemKey) ? $itemKey : null;
            $sanitized[$itemKey] = $this->sanitizeValue($itemValue, $itemKeyString);
        }

        return $sanitized;
    }

    private function isSensitiveKey(string $key): bool
    {
        $normalized = Str::lower($key);

        if (in_array($normalized, self::SENSITIVE_KEYS, true)) {
            return true;
        }

        return Str::contains($normalized, [
            'password',
            'token',
            'secret',
            'signature',
            'otp',
            'cvv',
            'cvc',
        ]);
    }
}
