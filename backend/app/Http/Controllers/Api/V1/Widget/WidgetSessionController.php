<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Widget\SmsOtp\WidgetSessionRequest;
use App\Models\Site;
use App\Services\Widget\SmsOtp\WidgetSessionTokenService;
use Illuminate\Http\JsonResponse;

final class WidgetSessionController extends BaseController
{
    public function __construct(
        private readonly WidgetSessionTokenService $tokenService,
    ) {
    }

    public function __invoke(WidgetSessionRequest $request): JsonResponse
    {
        $origin = (string) $request->header('Origin', '');
        $siteKey = $request->string('siteKey')->toString();

        $site = Site::where('site_key', $siteKey)->first();

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        if (! $this->isOriginAllowed($site, $origin)) {
            return $this->error('FORBIDDEN', 'Origin not allowed.', 403);
        }

        $tokenData = $this->tokenService->issue($site);

        return $this->success($tokenData);
    }

    private function isOriginAllowed(Site $site, string $origin): bool
    {
        if ($origin === '') {
            return false;
        }

        /** @var array<int, string>|null $allowedOrigins */
        $allowedOrigins = $site->allowed_origins;

        if (empty($allowedOrigins)) {
            return false;
        }

        $normalizedOrigin = rtrim(strtolower($origin), '/');

        foreach ($allowedOrigins as $allowed) {
            if (rtrim(strtolower((string) $allowed), '/') === $normalizedOrigin) {
                return true;
            }
        }

        return false;
    }
}
