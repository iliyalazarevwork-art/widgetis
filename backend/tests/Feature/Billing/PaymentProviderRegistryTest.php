<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\BillingPeriod;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
use App\Exceptions\UnknownPaymentProviderException;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\DTO\CheckoutResult;
use App\Services\Billing\DTO\WebhookResult;
use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\Providers\MonobankProvider;
use App\Services\Billing\Providers\WayForPayProvider;
use App\Services\Billing\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PaymentProviderRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('app.url', 'https://app.test');
        Config::set('monobank.token', 'fake-merchant-token');
        Config::set('monobank.webhook_url', 'https://app.test/api/v1/webhooks/monobank');
        Config::set('monobank.redirect_url', 'https://app.test/cabinet/billing');
        Config::set('services.wayforpay.merchant_account', 'test_merch_n1');
        Config::set('services.wayforpay.secret_key', 'flk3409refn54t54t*FNJRET');
        Config::set('services.wayforpay.merchant_domain_name', 'www.market.ua');
    }

    public function test_registry_resolves_monobank_provider(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $provider = $registry->get(PaymentProvider::Monobank);

        $this->assertInstanceOf(MonobankProvider::class, $provider);
        $this->assertSame(PaymentProvider::Monobank, $provider->name());
    }

    public function test_registry_resolves_wayforpay_provider(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $provider = $registry->get(PaymentProvider::WayForPay);

        $this->assertInstanceOf(WayForPayProvider::class, $provider);
        $this->assertSame(PaymentProvider::WayForPay, $provider->name());
    }

    public function test_registry_resolves_provider_for_subscription(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::WayForPay,
        ]);

        $provider = $registry->for($subscription);

        $this->assertInstanceOf(WayForPayProvider::class, $provider);
    }

    public function test_registry_throws_when_subscription_has_no_provider(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $subscription = Subscription::factory()->pending()->create();

        $this->expectException(UnknownPaymentProviderException::class);
        $registry->for($subscription);
    }

    public function test_registry_throws_when_provider_not_registered(): void
    {
        $registry = new PaymentProviderRegistry();

        $this->expectException(UnknownPaymentProviderException::class);
        $registry->get(PaymentProvider::Monobank);
    }

    public function test_wayforpay_provider_returns_post_form_checkout_result(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::WayForPay);

        $user = User::factory()->create();
        $plan = Plan::factory()->pro()->create();
        $order = Order::factory()->for($plan)->for($user)->create([
            'amount' => $plan->price_monthly,
        ]);

        $result = $provider->createSubscriptionCheckout(
            user: $user,
            plan: $plan,
            billingPeriod: BillingPeriod::Monthly,
            reference: $order->order_number,
        );

        $this->assertInstanceOf(CheckoutResult::class, $result);
        $this->assertSame('POST', $result->method);
        $this->assertSame('https://secure.wayforpay.com/pay', $result->url);
        $this->assertArrayHasKey('merchantAccount', $result->formFields);
        $this->assertArrayHasKey('merchantSignature', $result->formFields);
        $this->assertSame($order->order_number, $result->providerReference);
    }

    public function test_monobank_provider_charge_recurring_is_noop(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::Monobank);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
        ]);

        $result = $provider->chargeRecurring($subscription);

        $this->assertTrue($result->success);
        $this->assertNull($result->transactionId);
    }

    public function test_subscription_service_cancel_delegates_through_registry(): void
    {
        /** @var SubscriptionService $service */
        $service = $this->app->make(SubscriptionService::class);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::Monobank,
            'payment_provider_subscription_id' => null,
        ]);

        $cancelled = $service->cancel($subscription, 'user requested');

        $this->assertSame(SubscriptionStatus::Cancelled, $cancelled->fresh()->status);
    }

    public function test_subscription_service_cancel_without_provider_does_not_call_registry(): void
    {
        /** @var SubscriptionService $service */
        $service = $this->app->make(SubscriptionService::class);

        $subscription = Subscription::factory()->pending()->create();

        $cancelled = $service->cancel($subscription);

        $this->assertSame(SubscriptionStatus::Cancelled, $cancelled->fresh()->status);
    }

    public function test_wayforpay_webhook_handles_invalid_signature(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::WayForPay);

        $request = \Illuminate\Http\Request::create('/webhook', 'POST', [], [], [], [], json_encode([
            'merchantSignature' => 'invalid',
        ]));
        $request->headers->set('CONTENT_TYPE', 'application/json');

        $result = $provider->handleWebhook($request);

        $this->assertInstanceOf(WebhookResult::class, $result);
        $this->assertFalse($result->signatureValid);
        $this->assertFalse($result->processed);
    }
}
