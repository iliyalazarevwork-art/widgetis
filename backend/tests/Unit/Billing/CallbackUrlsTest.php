<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Exceptions\Billing\InvalidCallbackUrlException;
use App\Services\Billing\ValueObjects\CallbackUrls;
use Tests\TestCase;

final class CallbackUrlsTest extends TestCase
{
    public function test_accepts_valid_https_urls(): void
    {
        $urls = new CallbackUrls(
            webhookUrl: 'https://example.com/webhook',
            returnUrl: 'https://example.com/return',
        );
        $this->assertSame('https://example.com/webhook', $urls->webhookUrl);
    }

    public function test_accepts_http_urls(): void
    {
        $urls = new CallbackUrls(
            webhookUrl: 'http://example.com/webhook',
            returnUrl: 'http://example.com/return',
        );
        $this->assertSame('http://example.com/webhook', $urls->webhookUrl);
    }

    public function test_accepts_optional_cancel_url_when_provided_as_https(): void
    {
        $urls = new CallbackUrls(
            webhookUrl: 'https://example.com/webhook',
            returnUrl: 'https://example.com/return',
            cancelUrl: 'https://example.com/cancel',
        );
        $this->assertSame('https://example.com/cancel', $urls->cancelUrl);
    }

    public function test_allows_null_cancel_url(): void
    {
        $urls = new CallbackUrls(
            webhookUrl: 'https://example.com/webhook',
            returnUrl: 'https://example.com/return',
        );
        $this->assertNull($urls->cancelUrl);
    }

    public function test_rejects_non_http_webhook_url(): void
    {
        $this->expectException(InvalidCallbackUrlException::class);
        new CallbackUrls(
            webhookUrl: 'ftp://example.com/webhook',
            returnUrl: 'https://example.com/return',
        );
    }

    public function test_rejects_non_http_return_url(): void
    {
        $this->expectException(InvalidCallbackUrlException::class);
        new CallbackUrls(
            webhookUrl: 'https://example.com/webhook',
            returnUrl: 'example.com/return',
        );
    }

    public function test_rejects_non_http_cancel_url(): void
    {
        $this->expectException(InvalidCallbackUrlException::class);
        new CallbackUrls(
            webhookUrl: 'https://example.com/webhook',
            returnUrl: 'https://example.com/return',
            cancelUrl: 'javascript:void(0)',
        );
    }
}
