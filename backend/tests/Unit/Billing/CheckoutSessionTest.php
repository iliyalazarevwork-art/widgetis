<?php

declare(strict_types=1);

use App\Services\Billing\Results\CheckoutSession;

it('creates a redirect session with GET method', function (): void {
    $session = CheckoutSession::redirect('https://pay.example.com/pay');

    expect($session->method)->toBe('GET');
    expect($session->url)->toBe('https://pay.example.com/pay');
    expect($session->formFields)->toBe([]);
    expect($session->providerReference)->toBeNull();
});

it('creates a redirect session with provider reference', function (): void {
    $session = CheckoutSession::redirect('https://pay.example.com/pay', 'order-123');

    expect($session->providerReference)->toBe('order-123');
});

it('creates a post form session with POST method', function (): void {
    $session = CheckoutSession::postForm('https://pay.example.com/submit', ['field' => 'value']);

    expect($session->method)->toBe('POST');
    expect($session->url)->toBe('https://pay.example.com/submit');
    expect($session->formFields)->toBe(['field' => 'value']);
    expect($session->providerReference)->toBeNull();
});

it('creates a post form session with provider reference', function (): void {
    $session = CheckoutSession::postForm('https://pay.example.com/submit', ['f' => 'v'], 'ref-abc');

    expect($session->providerReference)->toBe('ref-abc');
});
