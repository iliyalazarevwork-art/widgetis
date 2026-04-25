<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Exceptions\Billing\MalformedWebhookException;
use Tests\TestCase;

final class InboundWebhookTest extends TestCase
{
    public function test_lowercases_header_keys_on_from_raw(): void
    {
        $webhook = InboundWebhook::fromRaw('{}', ['Content-Type' => 'application/json', 'X-Signature' => 'abc'], '127.0.0.1');

        $this->assertArrayHasKey('content-type', $webhook->headers);
        $this->assertArrayHasKey('x-signature', $webhook->headers);
        $this->assertArrayNotHasKey('Content-Type', $webhook->headers);
    }

    public function test_decodes_valid_json_body(): void
    {
        $webhook = InboundWebhook::fromRaw('{"key":"value"}', [], '127.0.0.1');
        $this->assertSame(['key' => 'value'], $webhook->jsonBody());
    }

    public function test_throws_on_malformed_json_body(): void
    {
        $this->expectException(MalformedWebhookException::class);
        $webhook = InboundWebhook::fromRaw('{invalid}', [], '127.0.0.1');
        $webhook->jsonBody();
    }

    public function test_throws_on_non_array_json_body(): void
    {
        $this->expectException(MalformedWebhookException::class);
        $webhook = InboundWebhook::fromRaw('"just a string"', [], '127.0.0.1');
        $webhook->jsonBody();
    }

    public function test_retrieves_header_case_insensitively(): void
    {
        $webhook = InboundWebhook::fromRaw('{}', ['x-custom-header' => 'hello'], '127.0.0.1');

        $this->assertSame('hello', $webhook->header('X-Custom-Header'));
        $this->assertSame('hello', $webhook->header('x-custom-header'));
        $this->assertSame('hello', $webhook->header('X-CUSTOM-HEADER'));
    }

    public function test_returns_null_for_missing_header(): void
    {
        $webhook = InboundWebhook::fromRaw('{}', [], '127.0.0.1');
        $this->assertNull($webhook->header('x-missing'));
    }

    public function test_stores_ip_address(): void
    {
        $webhook = InboundWebhook::fromRaw('{}', [], '192.168.1.1');
        $this->assertSame('192.168.1.1', $webhook->ip);
    }

    public function test_stores_raw_body_as_is(): void
    {
        $webhook = InboundWebhook::fromRaw('raw content', [], '127.0.0.1');
        $this->assertSame('raw content', $webhook->rawBody);
    }
}
