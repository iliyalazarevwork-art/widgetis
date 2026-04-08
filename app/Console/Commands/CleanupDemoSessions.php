<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\DemoSession;
use Illuminate\Console\Command;

class CleanupDemoSessions extends Command
{
    protected $signature = 'demo:cleanup';
    protected $description = 'Delete expired demo sessions';

    public function handle(): int
    {
        $count = DemoSession::where('expires_at', '<', now())->delete();

        $this->info("Deleted {$count} expired demo sessions.");

        return self::SUCCESS;
    }
}
