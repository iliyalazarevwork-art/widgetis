<?php

declare(strict_types=1);

use App\Exceptions\Billing\MalformedWebhookException;
use App\Services\Billing\Webhooks\InboundWebhook;

it('lowercases header keys on fromRaw', function (): void {
    $webhook = InboundWebhook::fromRaw('{}', ['Content-Type' => 'application/json', 'X-Signature' => 'abc'], '127.0.0.1');

    expect($webhook->headers)->toHaveKey('content-type');
    expect($webhook->headers)->toHaveKey('x-signature');
    expect($webhook->headers)->not->toHaveKey('Content-Type');
});

it('decodes valid json body', function (): void {
    $webhook = InboundWebhook::fromRaw('{"key":"value"}', [], '127.0.0.1');
    expect($webhook->jsonBody())->toBe(['key' => 'value']);
});

it('throws on malformed json body', function (): void {
    $webhook = InboundWebhook::fromRaw('{invalid}', [], '127.0.0.1');
    expect(fn () => $webhook->jsonBody())->toThrow(MalformedWebhookException::class);
});

it('throws on non-array json body', function (): void {
    $webhook = InboundWebhook::fromRaw('"just a string"', [], '127.0.0.1');
    expect(fn () => $webhook->jsonBody())->toThrow(MalformedWebhookException::class);
});

it('retrieves header case-insensitively', function (): void {
    $webhook = InboundWebhook::fromRaw('{}', ['x-custom-header' => 'hello'], '127.0.0.1');

    expect($webhook->header('X-Custom-Header'))->toBe('hello');
    expect($webhook->header('x-custom-header'))->toBe('hello');
    expect($webhook->header('X-CUSTOM-HEADER'))->toBe('hello');
});

it('returns null for missing header', function (): void {
    $webhook = InboundWebhook::fromRaw('{}', [], '127.0.0.1');
    expect($webhook->header('x-missing'))->toBeNull();
});

it('stores ip address', function (): void {
    $webhook = InboundWebhook::fromRaw('{}', [], '192.168.1.1');
    expect($webhook->ip)->toBe('192.168.1.1');
});

it('stores raw body as-is', function (): void {
    $webhook = InboundWebhook::fromRaw('raw content', [], '127.0.0.1');
    expect($webhook->rawBody)->toBe('raw content');
});
