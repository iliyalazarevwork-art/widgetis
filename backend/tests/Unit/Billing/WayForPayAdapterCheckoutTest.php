<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\Adapters\WayForPayAdapter;
use App\Core\Services\Billing\Commands\StartSubscriptionCommand;
use App\Core\Services\Billing\Results\CheckoutSession;
use App\Core\Services\Billing\ValueObjects\CallbackUrls;
use App\Core\Services\Billing\ValueObjects\Currency;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use App\Core\Services\Billing\ValueObjects\Money;
use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Core\Services\Billing\WayForPayService;
use App\Enums\BillingPeriod;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class WayForPayAdapterCheckoutTest extends TestCase
{
    private WayForPayService&MockObject $sdk;

    private WayForPayAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sdk     = $this->createMock(WayForPayService::class);
        $this->adapter = new WayForPayAdapter($this->sdk);
    }

    #[Test]
    public function it_builds_post_form_checkout_session_from_sdk_form_data(): void
    {
        $this->sdk
            ->expects($this->once())
            ->method('buildVerifyCheckoutForm')
            ->willReturn([
                'url'  => 'https://secure.wayforpay.com/pay',
                'form' => [
                    'merchantAccount'    => 'test_merch',
                    'orderReference'     => 'ORDER-ABC',
                    'amount'             => '1.00',
                    'productName'        => ['Widgetis Pro'],
                    'productCount'       => [1],
                    'merchantSignature'  => 'abcdef',
                ],
            ]);

        $cmd = new StartSubscriptionCommand(
            reference: 'ORDER-ABC',
            firstChargeAmount: Money::fromMajor(1.0, Currency::UAH),
            recurringAmount: Money::fromMajor(799.0, Currency::UAH),
            period: BillingPeriod::Monthly,
            trialDays: 7,
            customer: CustomerProfile::of('test@example.com', '380661234567', 'Ivan', 'Petrov', 'uk'),
            label: ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'активація картки', 'uk'),
            urls: new CallbackUrls(
                webhookUrl: 'https://example.com/webhook',
                returnUrl: 'https://example.com/return',
            ),
        );

        $session = $this->adapter->startSubscription($cmd);

        $this->assertInstanceOf(CheckoutSession::class, $session);
        $this->assertSame('POST', $session->method);
        $this->assertSame('https://secure.wayforpay.com/pay', $session->url);
        $this->assertSame('ORDER-ABC', $session->providerReference);

        // Array fields must be expanded with bracket notation.
        $this->assertArrayHasKey('productName[0]', $session->formFields);
        $this->assertArrayHasKey('productCount[0]', $session->formFields);
        $this->assertSame('Widgetis Pro', $session->formFields['productName[0]']);

        // Scalar fields must be flat strings.
        $this->assertArrayHasKey('merchantAccount', $session->formFields);
        $this->assertSame('test_merch', $session->formFields['merchantAccount']);
    }

    #[Test]
    public function it_passes_correct_parameters_to_sdk_build_method(): void
    {
        $this->sdk
            ->expects($this->once())
            ->method('buildVerifyCheckoutForm')
            ->with(
                reference: 'ORDER-XYZ',
                verifyMoney: $this->callback(static fn (Money $m): bool => $m->minorAmount === 100),
                recurringMoney: $this->callback(static fn (Money $m): bool => $m->minorAmount === 79900),
                period: BillingPeriod::Monthly,
                trialDays: 14,
                customer: $this->callback(static fn (CustomerProfile $c): bool => $c->email === 'user@test.com'),
                label: $this->anything(),
                serviceUrl: 'https://example.com/webhook',
                returnUrl: 'https://example.com/return',
            )
            ->willReturn([
                'url'  => 'https://secure.wayforpay.com/pay',
                'form' => [],
            ]);

        $cmd = new StartSubscriptionCommand(
            reference: 'ORDER-XYZ',
            firstChargeAmount: Money::fromMajor(1.0, Currency::UAH),
            recurringAmount: Money::fromMajor(799.0, Currency::UAH),
            period: BillingPeriod::Monthly,
            trialDays: 14,
            customer: CustomerProfile::of('user@test.com', '', 'Test', 'User', 'en'),
            label: ProductLabel::forSubscription('Basic', BillingPeriod::Monthly, 'activation', 'en'),
            urls: new CallbackUrls(
                webhookUrl: 'https://example.com/webhook',
                returnUrl: 'https://example.com/return',
            ),
        );

        $session = $this->adapter->startSubscription($cmd);

        $this->assertSame('ORDER-XYZ', $session->providerReference);
    }
}
