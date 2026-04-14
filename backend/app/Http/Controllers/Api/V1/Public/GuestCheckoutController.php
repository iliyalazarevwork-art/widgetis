<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\SiteStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Site;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Billing\PaymentProviderRegistry;
use App\Services\Billing\UniqueOrderNumberProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Public (unauthenticated) checkout endpoint for new users coming from the
 * landing page. Creates an account by email if one does not yet exist, then
 * creates the order → pending subscription → payment → provider invoice chain
 * and returns the Monobank redirect URL (or LiqPay POST form data).
 *
 * Redirect after payment points to /checkout/success (not /cabinet/plan).
 */
class GuestCheckoutController
{
    public function __construct(
        private readonly PaymentProviderRegistry $providers,
        private readonly UniqueOrderNumberProvider $orderNumbers,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'          => ['required', 'email', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'site_domain'    => ['required', 'string', 'max:255'],
            'platform'       => ['nullable', 'string', 'max:100'],
            'plan_slug'      => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
            'provider'       => ['required', 'string', 'in:liqpay,monobank'],
        ]);

        $plan          = Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);
        $provider      = PaymentProvider::from($validated['provider']);

        $frontendBase = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $redirectUrl  = $frontendBase . '/checkout/success';

        /** @var array{user: User, order: Order} $pending */
        $pending = DB::transaction(function () use ($validated, $plan, $billingPeriod, $provider): array {
            /** @var User $user */
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name'     => Str::before($validated['email'], '@'),
                    'phone'    => $validated['phone'] ?? null,
                    'password' => bcrypt(Str::random(32)),
                    'locale'   => 'uk',
                ],
            );

            if ($user->isAdmin()) {
                abort(422, 'Admin accounts cannot use guest checkout.');
            }

            if (! $user->hasRole(UserRole::Customer->value)) {
                $user->assignRole(UserRole::Customer->value);
            }

            if ($user->subscription?->isActive()) {
                abort(422, 'User already has an active subscription.');
            }

            $recentPending = Order::where('user_id', $user->id)
                ->where('status', OrderStatus::Pending)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->exists();

            if ($recentPending) {
                abort(429, 'A checkout is already in progress. Please wait a moment before trying again.');
            }

            Site::firstOrCreate(
                ['user_id' => $user->id, 'domain' => $validated['site_domain']],
                [
                    'name'     => $validated['site_domain'],
                    'url'      => 'https://' . $validated['site_domain'],
                    'platform' => $validated['platform'] ?? 'horoshop',
                    'status'   => SiteStatus::Pending,
                ],
            );

            $amount = $billingPeriod === BillingPeriod::Yearly
                ? $plan->price_yearly
                : $plan->price_monthly;

            $order = Order::create([
                'order_number'     => $this->orderNumbers->get($validated['site_domain'], $plan->slug),
                'user_id'          => $user->id,
                'plan_id'          => $plan->id,
                'billing_period'   => $billingPeriod->value,
                'amount'           => $amount,
                'discount_amount'  => 0,
                'currency'         => 'UAH',
                'status'           => OrderStatus::Pending,
                'payment_provider' => $provider,
            ]);

            Subscription::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'plan_id'                          => $plan->id,
                    'billing_period'                   => $billingPeriod->value,
                    'status'                           => SubscriptionStatus::Pending,
                    'is_trial'                         => false,
                    'trial_ends_at'                    => null,
                    'current_period_start'             => now(),
                    'current_period_end'               => now()->addDays((int) ($plan->trial_days ?? 7)),
                    'payment_provider'                 => $provider,
                    'payment_provider_subscription_id' => null,
                    'payment_retry_count'              => 0,
                ],
            );

            $subscription = Subscription::where('user_id', $user->id)->first();

            Payment::create([
                'user_id'          => $user->id,
                'order_id'         => $order->id,
                'subscription_id'  => $subscription?->id,
                'type'             => PaymentType::Charge->value,
                'amount'           => (float) $amount,
                'currency'         => 'UAH',
                'status'           => PaymentStatus::Pending->value,
                'payment_provider' => $provider,
                'description'      => [
                    'en' => "Subscription: {$plan->slug} ({$billingPeriod->value})",
                    'uk' => "Підписка: {$plan->slug} ({$billingPeriod->value})",
                ],
            ]);

            Log::channel('payments')->info('guest_checkout.created', [
                'user_id'      => $user->id,
                'email'        => $user->email,
                'order_number' => $order->order_number,
                'plan'         => $plan->slug,
                'provider'     => $provider->value,
            ]);

            return ['user' => $user, 'order' => $order];
        });

        $checkoutResult = $this->providers->get($provider)->createSubscriptionCheckout(
            user: $pending['user'],
            plan: $plan,
            billingPeriod: $billingPeriod,
            reference: $pending['order']->order_number,
            redirectUrl: $redirectUrl,
        );

        return response()->json([
            'data' => [
                'provider'           => $provider->value,
                'reference'          => $pending['order']->order_number,
                'method'             => $checkoutResult->method,
                'url'                => $checkoutResult->url,
                'form_fields'        => (object) $checkoutResult->formFields,
                'provider_reference' => $checkoutResult->providerReference,
            ],
        ], 201);
    }
}
