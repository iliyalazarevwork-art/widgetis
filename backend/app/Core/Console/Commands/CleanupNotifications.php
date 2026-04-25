<?php

declare(strict_types=1);

namespace App\Core\Console\Commands;

use App\Core\Models\AppNotification;
use Illuminate\Console\Command;

class CleanupNotifications extends Command
{
    protected $signature = 'notifications:cleanup {--days=90}';
    protected $description = 'Delete read notifications older than N days';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $count = AppNotification::where('is_read', true)
            ->where('created_at', '<', now()->subDays($days))
            ->delete();

        $this->info("Deleted {$count} old notifications (>{$days} days).");

        return self::SUCCESS;
    }
}
