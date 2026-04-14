<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurgeNonAdminUsers extends Command
{
    protected $signature = 'users:purge-non-admin {--force : Actually perform the deletion}';

    protected $description = 'Pre-launch cleanup: delete every non-admin user and all their data.';

    public function handle(): int
    {
        $ids = User::whereDoesntHave(
            'roles',
            fn ($q) => $q->where('name', UserRole::Admin->value),
        )->pluck('id');

        if ($ids->isEmpty()) {
            $this->info('No non-admin users found — nothing to purge.');

            return self::SUCCESS;
        }

        $this->warn("Found {$ids->count()} non-admin user(s) to purge.");

        if (! $this->option('force')) {
            $this->line('Dry run — pass --force to actually delete.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($ids): void {
            // Leaf tables first, then tables with FK to sites, then sites, then users.
            $siteIds = DB::table('sites')->whereIn('user_id', $ids)->pluck('id');

            DB::table('site_widgets')->whereIn('site_id', $siteIds)->delete();
            DB::table('site_scripts')->whereIn('site_id', $siteIds)->delete();
            DB::table('manager_requests')->whereIn('site_id', $siteIds)->delete();

            DB::table('payments')->whereIn('user_id', $ids)->delete();
            DB::table('orders')->whereIn('user_id', $ids)->delete();
            DB::table('reviews')->whereIn('user_id', $ids)->delete();
            DB::table('subscriptions')->whereIn('user_id', $ids)->delete();
            DB::table('notifications')->whereIn('user_id', $ids)->delete();
            DB::table('interest_requests')->whereIn('user_id', $ids)->delete();
            DB::table('social_accounts')->whereIn('user_id', $ids)->delete();
            DB::table('demo_sessions')->whereIn('created_by', $ids)->delete();
            DB::table('user_widget_grants')->whereIn('user_id', $ids)->delete();
            DB::table('activity_log')->whereIn('user_id', $ids)->delete();
            DB::table('sessions')->whereIn('user_id', $ids)->delete();

            DB::table('sites')->whereIn('user_id', $ids)->delete();

            User::whereIn('id', $ids)->delete();
        });

        Log::channel('auth')->warning('Non-admin users purged', [
            'count' => $ids->count(),
            'ids' => $ids->all(),
        ]);

        $this->info("Purged {$ids->count()} non-admin user(s).");

        return self::SUCCESS;
    }
}
