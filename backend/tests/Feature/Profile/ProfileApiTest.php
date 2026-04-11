<?php

declare(strict_types=1);

namespace Tests\Feature\Profile;

use App\Enums\UserRole;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function makeCustomer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    private function makeAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }

    // -------------------------------------------------------------------------
    // Auth boundaries
    // -------------------------------------------------------------------------

    public function test_guest_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(401);
    }

    public function test_admin_cannot_access_profile(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'api')->getJson('/api/v1/profile');

        $response->assertStatus(403);
    }

    public function test_customer_can_access_profile(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile');

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $user->id);
    }

    // -------------------------------------------------------------------------
    // Profile show / update
    // -------------------------------------------------------------------------

    public function test_profile_show_returns_current_user_fields(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile');

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $user->id);
        $response->assertJsonPath('data.email', $user->email);
        $response->assertJsonPath('data.name', $user->name);
        $response->assertJsonStructure(['data' => ['id', 'name', 'email', 'locale']]);
    }

    public function test_profile_update_persists_name_and_locale(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->putJson('/api/v1/profile', [
            'name' => 'New Name',
            'locale' => 'en',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'locale' => 'en',
        ]);
    }

    // -------------------------------------------------------------------------
    // Dashboard
    // -------------------------------------------------------------------------

    public function test_dashboard_requires_auth(): void
    {
        $response = $this->getJson('/api/v1/profile/dashboard');

        $response->assertStatus(401);
    }

    public function test_dashboard_returns_200_for_customer(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile/dashboard');

        $response->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Subscription show
    // -------------------------------------------------------------------------

    public function test_subscription_show_returns_null_state_for_user_without_subscription(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile/subscription');

        // Controller returns 404 with error payload when no subscription exists
        $response->assertStatus(404);
    }

    public function test_subscription_show_returns_active_subscription_data(): void
    {
        $user = $this->makeCustomer();
        $plan = Plan::factory()->pro()->create();
        Subscription::factory()->for($user)->for($plan)->create();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile/subscription');

        $response->assertStatus(200);
        $response->assertSee('pro');
    }

    // -------------------------------------------------------------------------
    // Sites
    // -------------------------------------------------------------------------

    public function test_guest_cannot_list_sites(): void
    {
        $response = $this->getJson('/api/v1/profile/sites');

        $response->assertStatus(401);
    }

    public function test_customer_can_list_empty_sites(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile/sites');

        $response->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Notifications
    // -------------------------------------------------------------------------

    public function test_notifications_index_requires_auth(): void
    {
        $response = $this->getJson('/api/v1/profile/notifications');

        $response->assertStatus(401);
    }

    public function test_notifications_index_returns_200_for_customer(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'api')->getJson('/api/v1/profile/notifications');

        $response->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Payments
    // -------------------------------------------------------------------------

    public function test_payments_index_returns_only_current_user_payments(): void
    {
        $user1 = $this->makeCustomer();
        $user2 = $this->makeCustomer();

        $payment1 = Payment::factory()->for($user1)->create();
        $payment2 = Payment::factory()->for($user2)->create();

        $response = $this->actingAs($user1, 'api')->getJson('/api/v1/profile/payments');

        $response->assertStatus(200);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($payment1->id, $ids);
        $this->assertNotContains($payment2->id, $ids);
    }
}
