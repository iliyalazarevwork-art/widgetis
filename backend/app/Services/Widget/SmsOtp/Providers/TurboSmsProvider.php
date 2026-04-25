<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp\Providers;

use App\Services\Widget\SmsOtp\Contracts\OtpProvider;
use App\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\Services\Widget\SmsOtp\Data\SendOtpResult;
use App\Services\Widget\SmsOtp\Exceptions\OtpProviderException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class TurboSmsProvider implements OtpProvider
{
    private const API_URL = 'https://api.turbosms.ua/message/send.json';

    /**
     * @param array<string, mixed> $credentials
     */
    public function __construct(
        private readonly array $credentials,
    ) {
    }

    public function send(SendOtpCommand $command): SendOtpResult
    {
        $token = (string) ($this->credentials['token'] ?? '');

        if ($token === '') {
            throw new OtpProviderException('TurboSMS: missing API token in credentials');
        }

        $response = Http::withToken($token)
            ->timeout(10)
            ->post(self::API_URL, [
                'recipients' => [$command->phone],
                'sms' => [
                    'sender' => $command->senderName,
                    'text' => $command->text,
                ],
            ]);

        if ($response->failed()) {
            Log::channel('widget')->error('turbosms.http_error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new OtpProviderException('TurboSMS: HTTP error ' . $response->status());
        }

        /** @var array<string, mixed> $body */
        $body = $response->json();
        $responseCode = (int) ($body['response_code'] ?? -1);

        if ($responseCode !== 0) {
            $responseStatus = (string) ($body['response_status'] ?? 'unknown');
            Log::channel('widget')->error('turbosms.api_error', [
                'response_code' => $responseCode,
                'response_status' => $responseStatus,
            ]);
            throw new OtpProviderException("TurboSMS: API error {$responseCode} — {$responseStatus}");
        }

        /** @var array<int, array<string, mixed>> $results */
        $results = (array) ($body['response_result'] ?? []);
        $messageId = (string) ($results[0]['message_id'] ?? '');

        return SendOtpResult::sent($messageId);
    }
}
