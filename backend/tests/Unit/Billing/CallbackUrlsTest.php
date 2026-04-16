<?php

declare(strict_types=1);

use App\Exceptions\Billing\InvalidCallbackUrlException;
use App\Services\Billing\ValueObjects\CallbackUrls;

it('accepts valid https urls', function (): void {
    $urls = new CallbackUrls(
        webhookUrl: 'https://example.com/webhook',
        returnUrl: 'https://example.com/return',
    );
    expect($urls->webhookUrl)->toBe('https://example.com/webhook');
});

it('accepts http urls', function (): void {
    $urls = new CallbackUrls(
        webhookUrl: 'http://example.com/webhook',
        returnUrl: 'http://example.com/return',
    );
    expect($urls->webhookUrl)->toBe('http://example.com/webhook');
});

it('accepts optional cancel url when provided as https', function (): void {
    $urls = new CallbackUrls(
        webhookUrl: 'https://example.com/webhook',
        returnUrl: 'https://example.com/return',
        cancelUrl: 'https://example.com/cancel',
    );
    expect($urls->cancelUrl)->toBe('https://example.com/cancel');
});

it('allows null cancel url', function (): void {
    $urls = new CallbackUrls(
        webhookUrl: 'https://example.com/webhook',
        returnUrl: 'https://example.com/return',
    );
    expect($urls->cancelUrl)->toBeNull();
});

it('rejects non-http webhook url', function (): void {
    expect(fn () => new CallbackUrls(
        webhookUrl: 'ftp://example.com/webhook',
        returnUrl: 'https://example.com/return',
    ))->toThrow(InvalidCallbackUrlException::class);
});

it('rejects non-http return url', function (): void {
    expect(fn () => new CallbackUrls(
        webhookUrl: 'https://example.com/webhook',
        returnUrl: 'example.com/return',
    ))->toThrow(InvalidCallbackUrlException::class);
});

it('rejects non-http cancel url', function (): void {
    expect(fn () => new CallbackUrls(
        webhookUrl: 'https://example.com/webhook',
        returnUrl: 'https://example.com/return',
        cancelUrl: 'javascript:void(0)',
    ))->toThrow(InvalidCallbackUrlException::class);
});
