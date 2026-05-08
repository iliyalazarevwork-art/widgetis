<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\User;
use Database\Seeders\AgentUserSeeder;
use Illuminate\Console\Command;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Mint a long-lived JWT for the local site-configurator agent.
 *
 * Usage:
 *   docker compose -f docker-compose.dev.yml exec backend \
 *     php artisan agent:issue-jwt
 *
 * Pipe the output into .env.local as AGENT_JWT=...
 *
 * The agent uses this token to authenticate to admin endpoints
 * (POST /api/v1/admin/demo-sessions). Token is local-only — never run this
 * against production. Aborts with a non-zero exit code outside the
 * `local`/`testing` environments to avoid accidental issuance.
 */
final class IssueAgentJwt extends Command
{
    protected $signature = 'agent:issue-jwt {--ttl-minutes=525600 : Token TTL in minutes (default 1 year)}';

    protected $description = 'Issue a long-lived JWT for the local site-configurator agent.';

    public function handle(): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('agent:issue-jwt is local-only. Aborting.');
            return self::FAILURE;
        }

        $agent = User::where('email', AgentUserSeeder::EMAIL)->first();
        if ($agent === null) {
            $this->error(
                'Agent user not found. Run `php artisan db:seed --class=AgentUserSeeder` first.',
            );
            return self::FAILURE;
        }

        $ttlMinutes = (int) $this->option('ttl-minutes');
        if ($ttlMinutes < 60 || $ttlMinutes > 60 * 24 * 365 * 5) {
            $this->error('TTL must be between 60 minutes and 5 years.');
            return self::FAILURE;
        }

        $customClaims = ['exp' => now()->addMinutes($ttlMinutes)->getTimestamp()];
        $token = JWTAuth::customClaims($customClaims)->fromUser($agent);

        $this->line($token);

        return self::SUCCESS;
    }
}
