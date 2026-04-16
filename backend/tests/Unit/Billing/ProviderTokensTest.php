<?php

declare(strict_types=1);

use App\Services\Billing\ValueObjects\ProviderTokens;

it('empty tokens has no any', function (): void {
    expect(ProviderTokens::empty()->hasAny())->toBeFalse();
});

it('tokens with subscription id has any', function (): void {
    $tokens = ProviderTokens::of('sub_123', null);
    expect($tokens->hasAny())->toBeTrue();
});

it('tokens with recurring token has any', function (): void {
    $tokens = ProviderTokens::of(null, 'tok_abc');
    expect($tokens->hasAny())->toBeTrue();
});

it('tokens with both values has any', function (): void {
    $tokens = ProviderTokens::of('sub_123', 'tok_abc');
    expect($tokens->hasAny())->toBeTrue();
});

it('tokens with empty string values has no any', function (): void {
    $tokens = ProviderTokens::of('', '');
    expect($tokens->hasAny())->toBeFalse();
});

it('exposes provider subscription id', function (): void {
    $tokens = ProviderTokens::of('sub_abc', null);
    expect($tokens->providerSubscriptionId)->toBe('sub_abc');
    expect($tokens->recurringToken)->toBeNull();
});
