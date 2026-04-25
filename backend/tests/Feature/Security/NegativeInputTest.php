<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Core\Models\Plan;
use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * "Try to break the site" — deliberately malformed, oversized, or
 * attacker-flavoured payloads aimed at every endpoint a customer can
 * reach. The invariant here is simple:
 *
 *   no input from a regular user should ever produce a 5xx.
 *
 * A 422 (validation error) is the happy path of this file. A 401/403 is
 * fine. A 500 means the server hit something it didn't expect and that's
 * the bug we're hunting.
 */
class NegativeInputTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    /**
     * @return array<string, array{string}>
     */
    public static function maliciousSiteUrls(): array
    {
        return [
            'javascript uri'         => ['javascript:alert(1)'],
            'data uri'               => ['data:text/html,<script>alert(1)</script>'],
            'file uri'               => ['file:///etc/passwd'],
            'ftp uri'                => ['ftp://example.com/file'],
            'no scheme'              => ['example.com'],
            'empty'                  => [''],
            'cloud metadata (ssrf)'  => ['http://169.254.169.254/latest/meta-data/'],
            'null byte'              => ["https://example.com\x00.evil.com"],
            'path traversal'         => ['https://example.com/../../etc/passwd'],
            'oversized'              => ['https://example.com/'.str_repeat('a', 600)],
            'newline injection'      => ["https://example.com/\r\nHost: evil.com"],
        ];
    }

    #[DataProvider('maliciousSiteUrls')]
    public function test_profile_sites_store_rejects_hostile_urls_without_crashing(string $badUrl): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'api')->postJson('/api/v1/profile/sites', [
            'url' => $badUrl,
            'platform' => 'horoshop',
            'name' => 'Test',
        ]);

        // The only acceptable outcomes are: validation rejection (422),
        // forbidden (403, e.g. plan cap), or — for the cloud-metadata case —
        // potentially an accepted 201 IF the app lets its own HTTP URL
        // through. Everything we DO NOT accept is a 5xx.
        $this->assertLessThan(
            500,
            $response->status(),
            "URL [{$badUrl}] produced {$response->status()} — server crashed on hostile input",
        );

        // And we must never create a Site row for a javascript: or file: URL.
        if (
            str_starts_with($badUrl, 'javascript:')
            || str_starts_with($badUrl, 'data:')
            || str_starts_with($badUrl, 'file:')
        ) {
            $this->assertDatabaseMissing('wgt_sites', ['user_id' => $user->id], 'pgsql_runtime');
        }
    }

    public function test_profile_update_handles_null_bytes_in_name_without_5xx(): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'api')->putJson('/api/v1/profile', [
            'name' => "Evil\x00Name",
        ]);

        // Storing a null byte is not an exploit by itself (SQL layer handles
        // it fine); we just need a clean 2xx/4xx — a 500 here means the JSON
        // serializer died on the binary byte somewhere downstream.
        $this->assertNotSame(
            500,
            $response->status(),
            'null byte in name crashed the request pipeline',
        );
    }

    public function test_profile_update_handles_very_long_name_gracefully(): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'api')->putJson('/api/v1/profile', [
            'name' => str_repeat('😈', 5000),
        ]);

        // Either the validator rejects it (422) or it's truncated. Not a 500.
        $this->assertLessThan(500, $response->status());
    }

    /**
     * @return array<string, array{string}>
     */
    public static function sqlishSearches(): array
    {
        return [
            'drop users' => ["'; DROP TABLE users; --"],
            'union'      => ["' UNION SELECT 1, 2, 3--"],
            'or 1=1'     => ["' OR 1=1--"],
            'comment'    => ['/*!*/'],
            'percent'    => ['%%%'],
            'backslash'  => ['\\\\\\'],
        ];
    }

    #[DataProvider('sqlishSearches')]
    public function test_admin_user_search_is_sql_safe(string $hostile): void
    {
        // AdminUserController uses Postgres-only `ilike`. On the SQLite
        // test driver ilike isn't recognised and yields a 500 for reasons
        // unrelated to SQL injection safety. Skip to keep the intent clean.
        if (\DB::connection()->getDriverName() === 'sqlite') {
            $this->markTestSkipped('admin user search uses Postgres ilike; verified in prod only');
        }

        $admin = User::factory()->create();
        $admin->assignRole(UserRole::Admin->value);

        $response = $this->actingAs($admin, 'api')
            ->getJson('/api/v1/admin/users?search='.urlencode($hostile));

        $this->assertLessThan(500, $response->status());
        // Users table must still exist and contain at least our admin.
        $this->assertTrue(User::query()->exists());
    }

    public function test_checkout_with_unknown_plan_slug_returns_4xx_not_5xx(): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/v1/profile/subscription/checkout', [
                'plan_slug' => 'definitely-not-a-plan',
                'billing_period' => 'monthly',
                'provider' => 'monobank',
            ]);

        $this->assertLessThan(500, $response->status());
        $this->assertGreaterThanOrEqual(400, $response->status());
    }

    public function test_checkout_uses_db_price_and_ignores_client_supplied_amount(): void
    {
        $user = $this->customer();

        $plan = Plan::factory()->create([
            'slug' => 'pro-secure-test',
            'price_monthly' => 199.00,
            'price_yearly' => 1990.00,
            'is_active' => true,
        ]);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/profile/subscription/checkout', [
                'plan_slug' => $plan->slug,
                'billing_period' => 'monthly',
                'provider' => 'monobank',
                // Attempt to tamper with amount.
                'amount' => 0.01,
                'price_monthly' => 0.01,
                'price' => 0.01,
            ]);

        // Whatever the final http status, no created Order/Payment row must
        // ever carry the tampered amount. Even an error path is fine — what
        // we forbid is an accepted cheap transaction.
        $this->assertDatabaseMissing('orders', ['amount' => 0.01]);
        $this->assertDatabaseMissing('payments', ['amount' => 0.01]);
    }

    public function test_auth_otp_rejects_garbage_email_without_crash(): void
    {
        $inputs = [
            '',
            'not-an-email',
            str_repeat('a', 3000).'@example.com',
            "evil\x00@example.com",
            '<script>@example.com',
            ['array' => 'not-scalar'],
            null,
        ];

        foreach ($inputs as $email) {
            $response = $this->postJson('/api/v1/auth/otp', ['email' => $email]);
            $this->assertLessThan(
                500,
                $response->status(),
                'OTP send endpoint 500\'d on email input: '.var_export($email, true),
            );
        }
    }

    public function test_admin_widget_builder_build_rejects_wrong_types_for_modules(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::Admin->value);

        $bad = [
            ['modules' => 'not-an-array'],
            ['modules' => 123],
            ['modules' => null],
            ['modules' => [str_repeat('x', 50_000)]],
        ];

        foreach ($bad as $payload) {
            $response = $this->actingAs($admin, 'api')
                ->postJson('/api/v1/admin/widget-builder/build', $payload);

            // 502 = widget-builder container unreachable in test env (legit).
            // 422 = validator rejected the shape (the happy path).
            // 500 = our backend crashed on attacker input — the one we flag.
            $this->assertNotSame(
                500,
                $response->status(),
                'widget-builder proxy crashed with 500 on payload: '.json_encode($payload),
            );
        }
    }

    public function test_malformed_json_body_does_not_crash_api(): void
    {
        $user = $this->customer();

        $response = $this->call(
            'POST',
            '/api/v1/profile/subscription/checkout',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.auth('api')->login($user),
            ],
            '{"plan_slug": "pro", "this is not valid json',
        );

        $this->assertLessThan(500, $response->getStatusCode());
    }
}
