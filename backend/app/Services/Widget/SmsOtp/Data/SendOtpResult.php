<?php

declare(strict_types=1);

namespace App\Services\Widget\SmsOtp\Data;

enum OtpSendStatus: string
{
    case Sent = 'sent';
    case Failed = 'failed';
}

final readonly class SendOtpResult
{
    private function __construct(
        public OtpSendStatus $status,
        public ?string $providerMessageId,
    ) {
    }

    public static function sent(string $providerMessageId): self
    {
        return new self(status: OtpSendStatus::Sent, providerMessageId: $providerMessageId);
    }

    public static function failed(): self
    {
        return new self(status: OtpSendStatus::Failed, providerMessageId: null);
    }

    public function isSent(): bool
    {
        return $this->status === OtpSendStatus::Sent;
    }
}
