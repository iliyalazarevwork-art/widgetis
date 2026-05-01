<?php

declare(strict_types=1);

namespace App\SmartSearch\Jobs;

use App\SmartSearch\Models\SiteSearchFeed;
use App\SmartSearch\Services\Feed\FeedSynchronizer;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

final class ImportSiteFeedJob implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 900;

    public function __construct(
        public readonly string $feedId,
    ) {
        $this->onConnection('redis');
        $this->onQueue('feeds');
    }

    public function uniqueId(): string
    {
        return $this->feedId;
    }

    public int $uniqueFor = 1800; // 30 minutes

    public function handle(FeedSynchronizer $synchronizer): void
    {
        $feed = SiteSearchFeed::find($this->feedId);

        if ($feed === null) {
            Log::warning("ImportSiteFeedJob: feed {$this->feedId} not found, skipping.");

            return;
        }

        $synchronizer->sync($feed);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("ImportSiteFeedJob: failed for feed {$this->feedId}.", [
            'error' => $e->getMessage(),
        ]);
    }
}
