<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Http\Requests\Widget\SmsOtp\SmsOtpVerifyRequest;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpExpiredException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpInvalidCodeException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpTooManyAttemptsException;
use App\WidgetRuntime\Services\Widget\SmsOtp\OtpService;
use Illuminate\Http\JsonResponse;

final class SmsOtpVerifyController extends BaseController
{
    public function __construct(
        private readonly OtpService $otpService,
    ) {
    }

    public function __invoke(SmsOtpVerifyRequest $request): JsonResponse
    {
        $requestId = $request->string('requestId')->toString();
        $code = $request->string('code')->toString();

        try {
            $this->otpService->verifyOtp($requestId, $code);
        } catch (OtpExpiredException $e) {
            return $this->error('OTP_EXPIRED', $e->getMessage(), 422);
        } catch (OtpTooManyAttemptsException $e) {
            return $this->error('TOO_MANY_ATTEMPTS', $e->getMessage(), 429);
        } catch (OtpInvalidCodeException $e) {
            return $this->error('INVALID_CODE', $e->getMessage(), 422);
        }

        return $this->success(['verified' => true]);
    }
}
