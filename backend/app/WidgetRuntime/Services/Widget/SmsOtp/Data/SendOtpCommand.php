<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\SmsOtp\Data;

use App\WidgetRuntime\Services\Widget\SmsOtp\Channel;

final readonly class SendOtpCommand
{
    private function __construct(
        public string $phone,
        public string $code,
        public string $senderName,
        public string $text,
        public Channel $channel,
        public string $locale,
    ) {
    }

    public static function make(
        string $phone,
        string $code,
        string $senderName,
        string $text,
        Channel $channel,
        string $locale,
    ): self {
        return new self(
            phone: $phone,
            code: $code,
            senderName: $senderName,
            text: $text,
            channel: $channel,
            locale: $locale,
        );
    }
}
