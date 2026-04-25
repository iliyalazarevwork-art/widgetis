<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Widget-builder proxy endpoints /api/v1/admin/widget-builder/* replace the
 * public /build, /modules, /deploy paths that used to be reverse-proxied
 * directly by Caddy. These routes MUST remain behind admin role — an IDOR
 * here would let any customer hit the internal builder with arbitrary input.
 */
class WidgetBuilderAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string, string}>
     */
    public static function widgetBuilderRoutes(): array
    {
        return [
            'modules' => ['GET', '/api/v1/admin/widget-builder/modules'],
            'build' => ['POST', '/api/v1/admin/widget-builder/build'],
        ];
    }

    #[DataProvider('widgetBuilderRoutes')]
    public function test_guest_gets_401(string $method, string $url): void
    {
        $this->json($method, $url, ['modules' => []])->assertStatus(401);
    }

    #[DataProvider('widgetBuilderRoutes')]
    public function test_customer_gets_403(string $method, string $url): void
    {
        $customer = User::factory()->create();
        $customer->assignRole(UserRole::Customer->value);

        $this->actingAs($customer, 'core')
            ->json($method, $url, ['modules' => ['m' => []]])
            ->assertStatus(403);
    }

    public function test_admin_build_validates_modules_parameter(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::Admin->value);

        // Missing `modules` → 422 (proves the route is reachable and validated,
        // not 401/403 and not a 500 bubbling up from the proxy call).
        $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/widget-builder/build', [])
            ->assertStatus(422);
    }

    public function test_admin_reaches_modules_endpoint_past_auth(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::Admin->value);

        $response = $this->actingAs($admin, 'core')
            ->getJson('/api/v1/admin/widget-builder/modules');

        // In test env the widget-builder container isn't reachable — we only
        // care that auth/role middleware let the request through. 502 is
        // expected when curl can't connect; 200 if the dev stack is up.
        $this->assertNotSame(401, $response->status());
        $this->assertNotSame(403, $response->status());
        $this->assertContains($response->status(), [200, 502]);
    }
}
