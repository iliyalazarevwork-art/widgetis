<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Models\User;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Insecure Direct Object Reference: user B must not be able to reach user A's
 * sites by guessing the numeric ID. The Profile SiteController scopes every
 * lookup through `currentUser()->sites()`, so a hit against a foreign ID has
 * to come back as 404 — never 200, never 403 with data leaked in the body.
 */
class SiteIdorTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    private function siteFor(User $owner, string $domain): Site
    {
        /** @var Site $site */
        $site = Site::create([
            'user_id' => $owner->id,
            'domain' => $domain,
            'url' => "https://{$domain}",
            'name' => $domain,
            'platform' => 'horoshop',
            'status' => 'active',
        ]);

        return $site;
    }

    public function test_customer_cannot_read_another_customers_site(): void
    {
        $alice = $this->customer();
        $bob = $this->customer();

        $aliceSite = $this->siteFor($alice, 'alice.example');

        $this->actingAs($bob, 'api')
            ->getJson("/api/v1/profile/sites/{$aliceSite->id}")
            ->assertStatus(404);
    }

    public function test_customer_cannot_delete_another_customers_site(): void
    {
        $alice = $this->customer();
        $bob = $this->customer();

        $aliceSite = $this->siteFor($alice, 'alice.example');

        $this->actingAs($bob, 'api')
            ->deleteJson("/api/v1/profile/sites/{$aliceSite->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('wgt_sites', ['id' => $aliceSite->id], 'pgsql_runtime');
    }

    public function test_customer_cannot_update_a_widget_on_another_customers_site(): void
    {
        $alice = $this->customer();
        $bob = $this->customer();

        $aliceSite = $this->siteFor($alice, 'alice.example');
        $product = \App\Models\Product::factory()->create();

        $response = $this->actingAs($bob, 'api')
            ->putJson("/api/v1/profile/sites/{$aliceSite->id}/widgets/{$product->id}", [
                'is_enabled' => true,
                'config' => ['x' => 1],
            ]);

        // Either scope lookup fails (404) or product access check fails (403) —
        // the only forbidden outcome is a 2xx that actually mutates Alice's site.
        $this->assertContains(
            $response->status(),
            [403, 404],
            "unexpected status {$response->status()} — could indicate IDOR leak",
        );

        // And Alice's site got no new widget rows as a side effect.
        $this->assertDatabaseMissing('wgt_site_widgets', [
            'site_id' => $aliceSite->id,
            'product_id' => $product->id,
        ], 'pgsql_runtime');
    }

    public function test_sites_index_only_returns_own_sites(): void
    {
        $alice = $this->customer();
        $bob = $this->customer();

        $this->siteFor($alice, 'alice.example');
        $this->siteFor($bob, 'bob.example');
        $this->siteFor($bob, 'bob-two.example');

        $response = $this->actingAs($bob, 'api')->getJson('/api/v1/profile/sites');
        $response->assertStatus(200);

        $domains = array_column($response->json('data') ?? $response->json(), 'domain');
        $this->assertNotContains('alice.example', $domains);
    }
}
