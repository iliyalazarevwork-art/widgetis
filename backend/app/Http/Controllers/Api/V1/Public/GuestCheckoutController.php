<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BillingPeriod;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Enums\UserRole;
use App\Http\Requests\Api\V1\Public\GuestCheckoutRequest;
use App\Models\Order;
use App\Models\User;
use App\Services\Billing\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Public (unauthenticated) checkout endpoint for new users coming from the
 * landing page. Creates an account by email if one does not yet exist, then
 * delegates to CheckoutService for the order → payment → provider chain.
 *
 * Redirect after payment points to /checkout/success (not /cabinet/plan).
 */
class GuestCheckoutController
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
    ) {
    }

    public function __invoke(GuestCheckoutRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $plan          = \App\Models\Plan::where('slug', $validated['plan_slug'])->where('is_active', true)->firstOrFail();
        $billingPeriod = BillingPeriod::from($validated['billing_period']);
        $provider      = PaymentProvider::from($validated['provider']);

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

        $frontendBase = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $redirectUrl  = $frontendBase . '/checkout/success';

        $payload = $this->checkoutService->createCheckout(
            user: $user,
            plan: $plan,
            billingPeriod: $billingPeriod,
            provider: $provider,
            siteDomain: $validated['site_domain'],
            platform: $validated['platform'] ?? null,
            redirectUrl: $redirectUrl,
        );

        Log::channel('payments')->info('guest_checkout.created', [
            'user_id'      => $user->id,
            'email'        => $user->email,
            'order_number' => $payload->reference,
            'plan'         => $plan->slug,
            'provider'     => $provider->value,
        ]);

        return response()->json([
            'data' => $payload->toResponseArray(),
        ], 201);
    }
}
