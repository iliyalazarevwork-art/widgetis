<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * Regression: /api/v1/profile/subscription/checkout used to call
 * ->withoutMiddleware(ThrottleRequests) which made it trivial to hammer
 * the payment provider and create runaway failed orders. The endpoint is
 * now rate-limited to 5 requests per minute per user. This test proves
 * the 6th request within the window is rejected with 429.
 */
class CheckoutThrottleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('api');
    }

    public function test_sixth_checkout_in_a_minute_is_throttled(): void
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        $hit429 = false;

        for ($i = 1; $i <= 7; $i++) {
            $response = $this->actingAs($user, 'core')
                ->postJson('/api/v1/profile/subscription/checkout', [
                    'plan_slug' => 'pro',
                    'billing_period' => 'monthly',
                ]);

            // First 5 calls may 422/404/500 (plan not seeded) — anything but 429
            // means the throttle still let them through.
            if ($i <= 5) {
                $this->assertNotSame(
                    429,
                    $response->status(),
                    "checkout #{$i} should not be throttled (was {$response->status()})",
                );
            }

            if ($response->status() === 429) {
                $hit429 = true;
                break;
            }
        }

        $this->assertTrue($hit429, 'expected throttle:5,60 to kick in by the 6th call');
    }
}
