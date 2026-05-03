<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp;

use App\WidgetRuntime\Models\OtpProviderConfig;
use App\WidgetRuntime\Models\OtpRequest;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpExpiredException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpInvalidCodeException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpNoActiveProviderException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpProviderException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpRateLimitException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpTooManyAttemptsException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

final class OtpService
{
    private const CODE_LENGTH = 6;
    private const CODE_TTL_SECONDS = 300; // 5 minutes
    private const MAX_VERIFY_ATTEMPTS = 5;
    private const PHONE_RATE_LIMIT = 3;
    private const SITE_RATE_LIMIT = 200;
    private const RATE_LIMIT_DECAY = 3600; // 1 hour

    public function __construct(
        private readonly OtpProviderRegistry $registry,
        private readonly PhoneNormalizer $normalizer,
    ) {
    }

    public function requestOtp(
        Site $site,
        string $rawPhone,
        string $locale,
        ?string $ip,
        ?string $userAgent,
        ?string $utmSource,
    ): OtpRequest {
        $phone = $this->normalizer->normalize($rawPhone);

        $this->enforceRateLimits($phone, (string) $site->id);

        $config = $this->resolveActiveConfig($site);
        $code = $this->generateCode();
        $text = $this->renderTemplate($config, $locale, $code);

        $command = SendOtpCommand::make(
            phone: $phone,
            code: $code,
            senderName: $config->sender_name,
            text: $text,
            channel: $config->channel,
            locale: $locale,
        );

        Log::channel('widget')->info('widget.smsotp.request.in', [
            'site_id' => $site->id,
            'phone' => $this->normalizer->mask($phone),
            'ip' => $ip,
        ]);

        $otpRequest = OtpRequest::create([
            'site_id' => $site->id,
            'request_id' => (string) Str::uuid(),
            'phone' => $phone,
            'code_hash' => Hash::make($code),
            'provider' => $config->provider,
            'channel' => $config->channel,
            'status' => OtpRequestStatus::Pending,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'utm_source' => $utmSource,
            'expires_at' => now()->addSeconds(self::CODE_TTL_SECONDS),
        ]);

        try {
            /** @var array<string, mixed> $credentials */
            $credentials = $config->credentials;
            $result = $this->registry
                ->resolve($config->provider, $credentials)
                ->send($command);

            $otpRequest->update([
                'status' => $result->isSent() ? OtpRequestStatus::Sent : OtpRequestStatus::Failed,
                'sent_at' => $result->isSent() ? now() : null,
            ]);
        } catch (OtpProviderException $e) {
            $otpRequest->update(['status' => OtpRequestStatus::Failed]);

            Log::channel('widget')->error('widget.smsotp.request.provider_error', [
                'site_id' => $site->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }

        Log::channel('widget')->info('widget.smsotp.request.out', [
            'site_id' => $site->id,
            'request_id' => $otpRequest->request_id,
            'status' => $otpRequest->status,
        ]);

        return $otpRequest;
    }

    public function verifyOtp(string $requestId, string $code): OtpRequest
    {
        $otpRequest = OtpRequest::where('request_id', $requestId)->first();

        if ($otpRequest === null) {
            throw new OtpInvalidCodeException(trans('messages.otp_request_not_found'));
        }

        Log::channel('widget')->info('widget.smsotp.verify.in', [
            'request_id' => $requestId,
            'site_id' => $otpRequest->site_id,
        ]);

        if ($otpRequest->isExpired()) {
            $otpRequest->update(['status' => OtpRequestStatus::Expired]);
            throw new OtpExpiredException(trans('messages.otp_code_expired'));
        }

        if ($otpRequest->attempts >= self::MAX_VERIFY_ATTEMPTS) {
            throw new OtpTooManyAttemptsException(trans('messages.otp_too_many_attempts'));
        }

        $otpRequest->increment('attempts');

        if (! Hash::check($code, $otpRequest->code_hash)) {
            throw new OtpInvalidCodeException(trans('messages.otp_invalid_code'));
        }

        $otpRequest->update([
            'status' => OtpRequestStatus::Verified,
            'verified_at' => now(),
        ]);

        Log::channel('widget')->info('widget.smsotp.verify.out', [
            'request_id' => $requestId,
            'site_id' => $otpRequest->site_id,
            'verified' => true,
        ]);

        return $otpRequest;
    }

    private function enforceRateLimits(string $phone, string $siteId): void
    {
        $phoneKey = "otp:phone:{$phone}";
        $siteKey = "otp:site:{$siteId}";

        if (RateLimiter::tooManyAttempts($phoneKey, self::PHONE_RATE_LIMIT)) {
            throw new OtpRateLimitException(trans('messages.otp_rate_limit_phone'));
        }

        if (RateLimiter::tooManyAttempts($siteKey, self::SITE_RATE_LIMIT)) {
            throw new OtpRateLimitException(trans('messages.otp_rate_limit_site'));
        }

        RateLimiter::hit($phoneKey, self::RATE_LIMIT_DECAY);
        RateLimiter::hit($siteKey, self::RATE_LIMIT_DECAY);
    }

    private function resolveActiveConfig(Site $site): OtpProviderConfig
    {
        $config = OtpProviderConfig::where('site_id', $site->id)
            ->where('is_active', true)
            ->where('channel', Channel::Sms->value)
            ->orderByDesc('priority')
            ->first();

        if ($config === null) {
            throw new OtpNoActiveProviderException(trans('messages.otp_no_active_provider'));
        }

        return $config;
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    private function renderTemplate(OtpProviderConfig $config, string $locale, string $code): string
    {
        /** @var array<string, string> $templates */
        $templates = (array) $config->templates;

        $text = $templates[$locale]
            ?? $templates['uk']
            ?? $templates['en']
            ?? (count($templates) > 0 ? (string) reset($templates) : 'Code: {code}');

        return str_replace('{code}', $code, $text);
    }
}
