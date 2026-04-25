<?php

declare(strict_types=1);

namespace Tests\Unit\Widget\SmsOtp;

use App\WidgetRuntime\Services\Widget\SmsOtp\Channel;
use App\WidgetRuntime\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpProviderException;
use App\WidgetRuntime\Services\Widget\SmsOtp\Providers\TurboSmsProvider;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TurboSmsProviderTest extends TestCase
{
    private function makeCommand(): SendOtpCommand
    {
        return SendOtpCommand::make(
            phone: '+380501234567',
            code: '123456',
            senderName: 'TestShop',
            text: 'Your code: 123456',
            channel: Channel::Sms,
            locale: 'uk',
        );
    }

    public function test_sends_correct_payload_to_turbosms_api(): void
    {
        Http::fake([
            'api.turbosms.ua/*' => Http::response([
                'response_code' => 0,
                'response_status' => 'OK',
                'response_result' => [['message_id' => 'msg-abc']],
            ], 200),
        ]);

        $provider = new TurboSmsProvider(['token' => 'my-test-token']);
        $result = $provider->send($this->makeCommand());

        $this->assertTrue($result->isSent());
        $this->assertSame('msg-abc', $result->providerMessageId);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.turbosms.ua/message/send.json'
                && $request['recipients'] === ['+380501234567']
                && $request['sms']['sender'] === 'TestShop'
                && $request['sms']['text'] === 'Your code: 123456'
                && $request->header('Authorization')[0] === 'Bearer my-test-token';
        });
    }

    public function test_throws_on_http_error(): void
    {
        Http::fake([
            'api.turbosms.ua/*' => Http::response('Internal Server Error', 500),
        ]);

        $this->expectException(OtpProviderException::class);

        $provider = new TurboSmsProvider(['token' => 'my-test-token']);
        $provider->send($this->makeCommand());
    }

    public function test_throws_on_api_error_response(): void
    {
        Http::fake([
            'api.turbosms.ua/*' => Http::response([
                'response_code' => 400,
                'response_status' => 'InvalidLogin',
            ], 200),
        ]);

        $this->expectException(OtpProviderException::class);

        $provider = new TurboSmsProvider(['token' => 'my-test-token']);
        $provider->send($this->makeCommand());
    }

    public function test_throws_when_credentials_token_is_empty(): void
    {
        $this->expectException(OtpProviderException::class);

        $provider = new TurboSmsProvider(['token' => '']);
        $provider->send($this->makeCommand());
    }

    public function test_throws_when_credentials_token_is_missing(): void
    {
        $this->expectException(OtpProviderException::class);

        $provider = new TurboSmsProvider([]);
        $provider->send($this->makeCommand());
    }
}
