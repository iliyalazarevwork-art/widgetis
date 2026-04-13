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
use App\Services\Billing\Providers\LiqPayProvider;
use App\Services\Billing\SubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * End-to-end verification that the new PaymentProvider abstraction correctly
 * wraps the legacy LiqPay services without regressing behaviour.
 */
class PaymentProviderRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.liqpay.public_key', 'sandbox_i12345678901');
        Config::set('services.liqpay.private_key', 'sandbox_PrivateKeyXXX');
        Config::set('services.liqpay.sandbox', true);
        Config::set('app.url', 'https://app.test');
    }

    public function test_registry_resolves_liqpay_provider(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $provider = $registry->get(PaymentProvider::LiqPay);

        $this->assertInstanceOf(LiqPayProvider::class, $provider);
        $this->assertSame(PaymentProvider::LiqPay, $provider->name());
    }

    public function test_registry_resolves_provider_for_subscription(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::LiqPay,
        ]);

        $provider = $registry->for($subscription);

        $this->assertInstanceOf(LiqPayProvider::class, $provider);
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
        $registry->get(PaymentProvider::LiqPay);
    }

    public function test_liqpay_provider_returns_post_form_checkout_result(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::LiqPay);

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
        $this->assertSame('https://www.liqpay.ua/api/3/checkout', $result->url);
        $this->assertArrayHasKey('data', $result->formFields);
        $this->assertArrayHasKey('signature', $result->formFields);
        $this->assertSame($order->order_number, $result->providerReference);
    }

    public function test_liqpay_provider_charge_recurring_is_noop(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::LiqPay);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::LiqPay,
        ]);

        $result = $provider->chargeRecurring($subscription);

        $this->assertTrue($result->success);
        $this->assertNull($result->transactionId);
    }

    public function test_subscription_service_cancel_delegates_through_registry(): void
    {
        Http::fake([
            'liqpay.ua/api/request' => Http::response(['status' => 'ok']),
        ]);

        /** @var SubscriptionService $service */
        $service = $this->app->make(SubscriptionService::class);

        $subscription = Subscription::factory()->create([
            'payment_provider' => PaymentProvider::LiqPay,
            'payment_provider_subscription_id' => 'SUB-123',
        ]);

        $cancelled = $service->cancel($subscription, 'user requested');

        $this->assertSame(SubscriptionStatus::Cancelled, $cancelled->fresh()->status);
        Http::assertSent(function ($request): bool {
            return str_contains((string) $request->url(), 'liqpay.ua/api/request');
        });
    }

    public function test_subscription_service_cancel_without_provider_does_not_call_registry(): void
    {
        Http::fake();

        /** @var SubscriptionService $service */
        $service = $this->app->make(SubscriptionService::class);

        $subscription = Subscription::factory()->pending()->create();

        $cancelled = $service->cancel($subscription);

        $this->assertSame(SubscriptionStatus::Cancelled, $cancelled->fresh()->status);
        Http::assertNothingSent();
    }

    public function test_liqpay_webhook_handles_invalid_signature(): void
    {
        /** @var PaymentProviderRegistry $registry */
        $registry = $this->app->make(PaymentProviderRegistry::class);
        $provider = $registry->get(PaymentProvider::LiqPay);

        $request = \Illuminate\Http\Request::create('/webhook', 'POST', [
            'data' => base64_encode('{"order_id":"X"}'),
            'signature' => 'definitely-wrong-signature',
        ]);

        $result = $provider->handleWebhook($request);

        $this->assertInstanceOf(WebhookResult::class, $result);
        $this->assertFalse($result->signatureValid);
        $this->assertFalse($result->processed);
    }
}
