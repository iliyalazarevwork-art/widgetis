<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Services\Billing\ValueObjects\ProviderTokens;
use Tests\TestCase;

final class ProviderTokensTest extends TestCase
{
    public function test_empty_tokens_has_no_any(): void
    {
        $this->assertFalse(ProviderTokens::empty()->hasAny());
    }

    public function test_tokens_with_subscription_id_has_any(): void
    {
        $this->assertTrue(ProviderTokens::of('sub_123', null)->hasAny());
    }

    public function test_tokens_with_recurring_token_has_any(): void
    {
        $this->assertTrue(ProviderTokens::of(null, 'tok_abc')->hasAny());
    }

    public function test_tokens_with_both_values_has_any(): void
    {
        $this->assertTrue(ProviderTokens::of('sub_123', 'tok_abc')->hasAny());
    }

    public function test_tokens_with_empty_string_values_has_no_any(): void
    {
        $this->assertFalse(ProviderTokens::of('', '')->hasAny());
    }

    public function test_exposes_provider_subscription_id(): void
    {
        $tokens = ProviderTokens::of('sub_abc', null);
        $this->assertSame('sub_abc', $tokens->providerSubscriptionId);
        $this->assertNull($tokens->recurringToken);
    }
}
