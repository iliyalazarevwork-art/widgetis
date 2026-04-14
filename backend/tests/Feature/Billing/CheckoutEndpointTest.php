<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckoutEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.liqpay.public_key', 'sandbox_i12345678901');
        Config::set('services.liqpay.private_key', 'sandbox_PrivateKeyXXX');
        Config::set('services.liqpay.sandbox', true);
        Config::set('app.url', 'https://app.test');
        Config::set('monobank.token', 'fake-merchant-token');
        Config::set('monobank.webhook_url', 'https://app.test/api/v1/webhooks/monobank');
        Config::set('monobank.redirect_url', 'https://app.test/cabinet/billing?status=success');
    }

    public function test_liqpay_checkout_returns_signed_post_form(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'   => $plan->slug,
            'billing_period' => 'monthly',
            'provider'    => 'liqpay',
            'site_domain' => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.provider', 'liqpay');
        $response->assertJsonPath('data.method', 'POST');
        $response->assertJsonPath('data.url', 'https://www.liqpay.ua/api/3/checkout');

        $form = $response->json('data.form_fields');
        $this->assertArrayHasKey('data', $form);
        $this->assertArrayHasKey('signature', $form);

        // Pre-persisted rows carry LiqPay as the chosen provider.
        $order = Order::where('user_id', $user->id)->sole();
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame(PaymentProvider::LiqPay, $order->payment_provider);

        $payment = Payment::where('user_id', $user->id)->sole();
        $this->assertSame(PaymentStatus::Pending->value, $payment->status);
        $this->assertSame(PaymentProvider::LiqPay, $payment->payment_provider);
    }

    public function test_monobank_checkout_returns_redirect_url_and_assigns_wallet(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/invoice/create' => Http::response([
                'invoiceId' => 'p2_mock_invoice_123',
                'pageUrl' => 'https://pay.mbnk.biz/p2_mock_invoice_123',
            ]),
        ]);

        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $this->assertNull($user->monobank_wallet_id);

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'monobank',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.provider', 'monobank');
        $response->assertJsonPath('data.method', 'GET');
        $response->assertJsonPath('data.url', 'https://pay.mbnk.biz/p2_mock_invoice_123');
        $response->assertJsonPath('data.provider_reference', 'p2_mock_invoice_123');

        $user->refresh();
        $this->assertNotNull($user->monobank_wallet_id);

        $subscription = Subscription::where('user_id', $user->id)->sole();
        $this->assertSame(PaymentProvider::Monobank, $subscription->payment_provider);
        // payment_provider_subscription_id is deliberately NOT written at
        // checkout time — it lands via handleWebhook when Monobank
        // confirms the charge, keeping idempotency reasoning local to
        // one place instead of being split between two writers.
        $this->assertNull($subscription->payment_provider_subscription_id);

        $order = Order::where('user_id', $user->id)->sole();
        $this->assertSame(PaymentProvider::Monobank, $order->payment_provider);

        Http::assertSent(function ($request): bool {
            if (! str_contains((string) $request->url(), 'invoice/create')) {
                return false;
            }
            $body = $request->data();
            return isset($body['saveCardData']['saveCard'], $body['saveCardData']['walletId'])
                && $body['saveCardData']['saveCard'] === true;
        });
    }

    public function test_checkout_rejects_unknown_provider(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'stripe',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(422);
    }

    public function test_checkout_rejects_when_already_subscribed(): void
    {
        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        Subscription::factory()->for($user)->for($plan)->create([
            'status' => SubscriptionStatus::Active,
            'payment_provider' => PaymentProvider::LiqPay,
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'liqpay',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertStatus(422);
        $response->assertJsonPath('error.code', 'ALREADY_SUBSCRIBED');
    }

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('customer');

        return $user;
    }

    /**
     * @return array<string, string>
     */
    private function authHeaders(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return [
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ];
    }
}
