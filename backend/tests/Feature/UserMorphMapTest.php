<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Core\Models\User;
use App\Enums\UserRole;
use Database\Seeders\RoleSeeder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Regression guard for AppServiceProvider::enforceMorphMap.
 *
 * Production broke once because the morph map omitted User, which made
 * spatie/laravel-permission throw ClassMorphViolationException whenever
 * anything touched $user->roles (e.g. the Google OAuth callback).
 */
class UserMorphMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_is_registered_in_morph_map_under_alias(): void
    {
        $map = Relation::morphMap();

        $this->assertArrayHasKey('user', $map);
        $this->assertSame(User::class, $map['user']);
    }

    public function test_user_get_morph_class_returns_alias_not_fqcn(): void
    {
        $user = User::factory()->create();

        $this->assertSame('user', $user->getMorphClass());
    }

    public function test_user_can_read_roles_relation_without_morph_violation(): void
    {
        $user = User::factory()->create();

        $roles = $user->roles;

        $this->assertTrue($roles->isEmpty());
    }

    public function test_user_can_be_assigned_a_role_and_stored_under_alias(): void
    {
        $this->seed(RoleSeeder::class);
        $user = User::factory()->create();

        $user->assignRole(UserRole::Customer->value);

        $this->assertTrue($user->fresh()->hasRole(UserRole::Customer->value));

        $storedType = DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->value('model_type');

        $this->assertSame('user', $storedType);
    }
}
