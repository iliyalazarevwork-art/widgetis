<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpInvalidWidgetSessionException;
use App\WidgetRuntime\Services\Widget\SmsOtp\WidgetSessionTokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class VerifyWidgetSession
{
    public function __construct(
        private readonly WidgetSessionTokenService $tokenService,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! is_string($header) || ! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Widget session token required.',
                ],
            ], 401);
        }

        $token = substr($header, 7);

        try {
            $site = $this->tokenService->verify($token);
        } catch (OtpInvalidWidgetSessionException $e) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_WIDGET_SESSION',
                    'message' => $e->getMessage(),
                ],
            ], 401);
        }

        $request->attributes->set('widget_site', $site);

        return $next($request);
    }
}
