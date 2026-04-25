<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\V1\BaseController;
use App\Http\Requests\Widget\SmsOtp\SmsOtpRequestRequest;
use App\Models\Site;
use App\Services\Widget\SmsOtp\Exceptions\OtpNoActiveProviderException;
use App\Services\Widget\SmsOtp\Exceptions\OtpProviderException;
use App\Services\Widget\SmsOtp\Exceptions\OtpRateLimitException;
use App\Services\Widget\SmsOtp\OtpService;
use Illuminate\Http\JsonResponse;

final class SmsOtpRequestController extends BaseController
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {
    }

    public function __invoke(SmsOtpRequestRequest $request): JsonResponse
    {
        /** @var Site $site */
        $site = $request->attributes->get('widget_site');

        $phone = $request->string('phone')->toString();
        $locale = $request->string('locale', app()->getLocale())->toString();
        $utmSource = $request->string('utm_source')->toString() ?: null;

        try {
            $otpRequest = $this->otpService->requestOtp(
                site: $site,
                rawPhone: $phone,
                locale: $locale,
                ip: $request->ip(),
                userAgent: $request->userAgent(),
                utmSource: $utmSource,
            );
        } catch (OtpRateLimitException $e) {
            return $this->error('RATE_LIMIT', $e->getMessage(), 429);
        } catch (OtpNoActiveProviderException $e) {
            return $this->error('NO_PROVIDER', $e->getMessage(), 503);
        } catch (OtpProviderException $e) {
            return $this->error('PROVIDER_ERROR', 'SMS could not be sent. Please try again.', 503);
        } catch (\InvalidArgumentException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }

        return $this->success([
            'requestId' => $otpRequest->request_id,
            'expiresAt' => $otpRequest->expires_at->toIso8601String(),
        ]);
    }
}
