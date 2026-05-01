<?php

declare(strict_types=1);

namespace App\SmartSearch\Console;

use App\SmartSearch\Enums\FeedSyncStatus;
use App\SmartSearch\Jobs\ImportSiteFeedJob;
use App\SmartSearch\Models\SiteSearchFeed;
use Illuminate\Console\Command;

final class SyncAllFeedsCommand extends Command
{
    protected $signature = 'smart-search:sync-all';

    protected $description = 'Dispatch one import job per active smart-search feed (run via cron every 6 h).';

    public function handle(): int
    {
        $feeds = SiteSearchFeed::query()
            ->whereIn('status', [
                FeedSyncStatus::Idle->value,
                FeedSyncStatus::Success->value,
                FeedSyncStatus::Failed->value,
            ])
            ->get();

        if ($feeds->isEmpty()) {
            $this->info('No feeds to sync.');

            return self::SUCCESS;
        }

        $dispatched = 0;

        foreach ($feeds as $feed) {
            ImportSiteFeedJob::dispatch((string) $feed->id);
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} feed sync job(s).");

        return self::SUCCESS;
    }
}
