<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Mass-assignment guard: a customer calling PUT /api/v1/profile must only
 * be able to touch `name`, `email`, `phone`, `telegram`, `company`, `locale`.
 *
 * If somebody ever widens the controller's `$request->only([...])` list by
 * mistake, this test catches it before a privilege escalation ships.
 */
class ProfileMassAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_promote_self_via_profile_update(): void
    {
        $user = User::factory()->create([
            'name' => 'Original',
            'email_verified_at' => null,
        ]);
        $user->assignRole(UserRole::Customer->value);

        $response = $this->actingAs($user, 'api')->putJson('/api/v1/profile', [
            'name' => 'New Name',
            // Privileged fields an attacker might hope get mass-assigned:
            'role' => 'admin',
            'id' => 9999,
            'email_verified_at' => now()->toDateTimeString(),
            'password' => 'not-a-field-but-try',
            'is_admin' => true,
        ]);

        $response->assertStatus(200);

        $user->refresh();

        $this->assertSame('New Name', $user->name, 'whitelisted fields should update');
        $this->assertNotSame(9999, $user->id, 'id must never be mass-assigned');
        $this->assertNull($user->email_verified_at, 'email_verified_at must not be set by the user');
        $this->assertTrue(
            $user->hasRole(UserRole::Customer->value),
            'customer must stay customer after a malicious profile update',
        );
        $this->assertFalse($user->hasRole(UserRole::Admin->value));
    }
}
