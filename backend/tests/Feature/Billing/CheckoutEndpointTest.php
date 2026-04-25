<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Order;
use App\Core\Models\Plan;
use App\Core\Models\Subscription;
use App\Core\Models\User;
use App\Enums\PaymentProvider;
use App\Enums\SubscriptionStatus;
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

        Config::set('app.url', 'https://app.test');
        Config::set('monobank.token', 'fake-merchant-token');
        Config::set('monobank.webhook_url', 'https://app.test/api/v1/webhooks/monobank');
        Config::set('monobank.redirect_url', 'https://app.test/cabinet/billing?status=success');
    }

    public function test_monobank_checkout_creates_subscription_and_returns_redirect(): void
    {
        Http::fake([
            'api.monobank.ua/api/merchant/subscription/create' => Http::response([
                'subscriptionId' => 'mono_sub_mock_123',
                'pageUrl' => 'https://pay.mbnk.biz/mono_sub_mock_123',
            ]),
        ]);

        $user = $this->customer();
        $plan = Plan::factory()->pro()->create();

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'monobank',
            'site_domain'    => 'mystore.com.ua',
        ], $this->authHeaders($user));

        $response->assertOk();
        $response->assertJsonPath('data.provider', 'monobank');
        $response->assertJsonPath('data.method', 'GET');
        $response->assertJsonPath('data.url', 'https://pay.mbnk.biz/mono_sub_mock_123');
        $response->assertJsonPath('data.provider_reference', 'mono_sub_mock_123');

        $subscription = Subscription::where('user_id', $user->id)->sole();
        $this->assertSame(PaymentProvider::Monobank, $subscription->payment_provider);
        $this->assertSame('mono_sub_mock_123', $subscription->payment_provider_subscription_id);

        $order = Order::where('user_id', $user->id)->sole();
        $this->assertSame(PaymentProvider::Monobank, $order->payment_provider);

        Http::assertSent(function ($request): bool {
            if (! str_contains((string) $request->url(), 'subscription/create')) {
                return false;
            }
            $body = $request->data();
            return isset($body['interval']) && $body['interval'] === '1m'
                && ($body['lang'] ?? null) === 'uk';
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
            'payment_provider' => PaymentProvider::Monobank,
        ]);

        $response = $this->postJson('/api/v1/profile/subscription/checkout', [
            'plan_slug'      => $plan->slug,
            'billing_period' => 'monthly',
            'provider'       => 'monobank',
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
