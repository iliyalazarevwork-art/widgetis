<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Commands\CancelSubscriptionCommand;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Contracts\PaymentProviderInterface;
use App\Core\Services\Billing\Contracts\ProviderCapabilities;
use App\Core\Services\Billing\Contracts\SupportsMerchantCharge;
use App\Core\Services\Billing\Contracts\SupportsPlanChange;
use App\Core\Services\Billing\Contracts\SupportsRefunds;
use App\Core\Services\Billing\Events\IgnoredEvent;
use App\Core\Services\Billing\Events\PaymentEvent;
use App\Core\Services\Billing\Results\CancellationResult;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\Webhooks\InboundWebhook;
use App\Enums\PaymentProvider;
use App\Exceptions\Billing\CapabilityNotSupportedException;
use Tests\TestCase;

final class ContractsTest extends TestCase
{
    public function test_interface_v2_is_interface(): void
    {
        $this->assertTrue(interface_exists(PaymentProviderInterface::class));

        $reflection = new \ReflectionClass(PaymentProviderInterface::class);
        $this->assertTrue($reflection->isInterface());
    }

    public function test_capability_interfaces_exist(): void
    {
        $this->assertTrue(interface_exists(SupportsRefunds::class));
        $this->assertTrue(interface_exists(SupportsMerchantCharge::class));
        $this->assertTrue(interface_exists(SupportsPlanChange::class));
    }

    public function test_capability_interfaces_are_not_required_by_core(): void
    {
        $impl = new class () implements PaymentProviderInterface {
            public function name(): PaymentProvider
            {
                return PaymentProvider::Monobank;
            }

            public function capabilities(): ProviderCapabilities
            {
                return new ProviderCapabilities(true, true, true, false, 24);
            }

            public function startSubscription(StartSubscriptionCommand $command): CheckoutSession
            {
                return CheckoutSession::redirect('https://x');
            }

            public function cancelSubscription(CancelSubscriptionCommand $command): CancellationResult
            {
                return CancellationResult::cancelled();
            }

            public function parseWebhook(InboundWebhook $webhook): PaymentEvent
            {
                return new IgnoredEvent('', 'noop', null);
            }
        };

        $this->assertInstanceOf(PaymentProviderInterface::class, $impl);

        // Verify the core contract does not extend the capability interfaces.
        $reflection = new \ReflectionClass($impl);
        $interfaceNames = array_keys($reflection->getInterfaces());
        $this->assertContains(PaymentProviderInterface::class, $interfaceNames);
        $this->assertNotContains(SupportsRefunds::class, $interfaceNames);
        $this->assertNotContains(SupportsMerchantCharge::class, $interfaceNames);
        $this->assertNotContains(SupportsPlanChange::class, $interfaceNames);
    }

    public function test_capability_not_supported_exception_messages(): void
    {
        $provider = PaymentProvider::WayForPay;

        $this->assertStringContainsString(
            'wayforpay',
            CapabilityNotSupportedException::refunds($provider)->getMessage(),
        );
        $this->assertStringContainsString(
            'wayforpay',
            CapabilityNotSupportedException::merchantCharge($provider)->getMessage(),
        );
        $this->assertStringContainsString(
            'wayforpay',
            CapabilityNotSupportedException::planChange($provider)->getMessage(),
        );
    }
}
