<?php

declare(strict_types=1);

namespace App\SmartSearch\Console;

use App\SmartSearch\Jobs\ImportSiteFeedJob;
use App\SmartSearch\Models\SiteSearchFeed;
use Illuminate\Console\Command;

final class SyncFeedCommand extends Command
{
    protected $signature = 'smart-search:sync-feed {feed_id : The UUID of the SiteSearchFeed to sync}';

    protected $description = 'Synchronise a single smart-search feed synchronously (for ops/debug).';

    public function handle(): int
    {
        $feedId = (string) $this->argument('feed_id');

        $feed = SiteSearchFeed::find($feedId);

        if ($feed === null) {
            $this->error("Feed not found: {$feedId}");

            return self::FAILURE;
        }

        $this->info("Dispatching sync for feed {$feedId} (site={$feed->site_id}, lang={$feed->lang}) …");

        ImportSiteFeedJob::dispatchSync($feedId);

        $this->info('Done.');

        return self::SUCCESS;
    }
}
