<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Core\Models\User;
use App\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds the service user the local site-configurator agent (Claude Code
 * subagent) authenticates as. The user is admin-roled because the agent
 * needs to call POST /api/v1/admin/demo-sessions to create per-site demos.
 *
 * Local/testing only — never registered for production. The corresponding
 * JWT is issued by `php artisan agent:issue-jwt` and lives in .env.local
 * as AGENT_JWT.
 */
class AgentUserSeeder extends Seeder
{
    public const EMAIL = 'agent@widgetis.local';

    public function run(): void
    {
        $agent = User::updateOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'Site Configurator Agent',
                'password' => Hash::make(Str::random(64)),
                'email_verified_at' => now(),
                'locale' => 'uk',
            ],
        );

        $agent->syncRoles([UserRole::Admin->value]);
    }
}
