<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Core\Models\Plan;
use App\Core\Models\User;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Reproduces the bug where a user submits site_domain like "https://t.u" or
 * "https://www.shop.com/path" and the Site row ends up with a domain that still
 * contains the scheme/path. Later ScriptBuilderService writes to R2 at
 * sites/{$site->domain}/{$slug}.js which produces an invalid URL like
 *   https://pub-xxx.r2.dev/sites/https://t.u/4vQ2S.js
 * and the install snippet 404s.
 *
 * Domain MUST be normalized via Site::domainFromUrl() before persistence,
 * regardless of the entry point (startTrial, checkout, guest checkout).
 */
class SiteDomainNormalizationOnCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_start_trial_normalizes_domain_with_scheme(): void
    {
        $user = $this->customer();
        Plan::factory()->basic()->create(['slug' => 'basic', 'trial_days' => 7]);

        $response = $this->postJson('/api/v1/profile/subscription/start-trial', [
            'plan_slug'   => 'basic',
            'site_domain' => 'https://t.u',
            'platform'    => 'horoshop',
        ], $this->authHeaders($user));

        $response->assertStatus(201);

        $site = Site::where('user_id', $user->id)->sole();

        $this->assertSame('t.u', $site->domain);
        $this->assertStringNotContainsString('://', $site->domain);
        $this->assertStringNotContainsString('/', $site->domain);
    }

    public function test_start_trial_strips_path_and_www(): void
    {
        $user = $this->customer();
        Plan::factory()->basic()->create(['slug' => 'basic', 'trial_days' => 7]);

        $response = $this->postJson('/api/v1/profile/subscription/start-trial', [
            'plan_slug'   => 'basic',
            'site_domain' => 'https://WWW.Example.COM/catalog',
            'platform'    => 'horoshop',
        ], $this->authHeaders($user));

        $response->assertStatus(201);

        $site = Site::where('user_id', $user->id)->sole();

        $this->assertSame('example.com', $site->domain);
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
            'Accept'        => 'application/json',
        ];
    }
}
