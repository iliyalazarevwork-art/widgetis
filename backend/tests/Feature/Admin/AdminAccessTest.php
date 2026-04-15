<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Boundary tests for /api/v1/admin/*.
 *
 * The admin namespace is gated by `auth:api` + `role:admin`. A regression
 * in either middleware chain would immediately expose admin data to
 * customers or anonymous users — so we assert the full matrix for each
 * read endpoint in one sweep.
 */
class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string}>
     */
    public static function adminReadRoutes(): array
    {
        return [
            'dashboard'     => ['/api/v1/admin/dashboard'],
            'users'         => ['/api/v1/admin/users'],
            'orders'        => ['/api/v1/admin/orders'],
            'subscriptions' => ['/api/v1/admin/subscriptions'],
            'sites'         => ['/api/v1/admin/sites'],
        ];
    }

    private function makeAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }

    private function makeCustomer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    #[DataProvider('adminReadRoutes')]
    public function test_guest_receives_401_for_admin_read_routes(string $url): void
    {
        $this->getJson($url)->assertStatus(401);
    }

    #[DataProvider('adminReadRoutes')]
    public function test_customer_receives_403_for_admin_read_routes(string $url): void
    {
        $customer = $this->makeCustomer();

        $this->actingAs($customer, 'api')->getJson($url)->assertStatus(403);
    }

    #[DataProvider('adminReadRoutes')]
    public function test_admin_can_access_admin_read_routes(string $url): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'api')->getJson($url);

        // Some routes return a paginated envelope, others return {data: {...}}.
        // The invariant is: admin never gets 401/403.
        $this->assertNotSame(401, $response->status(), "{$url} returned 401 for admin");
        $this->assertNotSame(403, $response->status(), "{$url} returned 403 for admin");
        $this->assertLessThan(500, $response->status(), "{$url} returned {$response->status()} for admin");
    }

    public function test_admin_users_show_returns_404_for_missing_user(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/users/9999999');

        $response->assertStatus(404);
    }

    public function test_admin_orders_show_returns_404_for_missing_order(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/admin/orders/9999999');

        $response->assertStatus(404);
    }
}
