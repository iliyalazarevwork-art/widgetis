<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Site;
use App\Services\Site\ScriptBuilderService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RebuildSiteScriptJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 10;

    public function __construct(
        public readonly int $siteId,
    ) {
    }

    public function handle(ScriptBuilderService $builder): void
    {
        $site = Site::with(['widgets.product', 'script.builds'])->find($this->siteId);

        if ($site === null) {
            Log::warning("RebuildSiteScriptJob: site {$this->siteId} not found, skipping.");
            return;
        }

        if ($site->script === null) {
            Log::warning("RebuildSiteScriptJob: site {$this->siteId} has no script, skipping.");
            return;
        }

        $build = $builder->build($site);

        Log::info("RebuildSiteScriptJob: site {$this->siteId} rebuilt successfully.", [
            'domain' => $site->domain,
            'version' => $build->version,
            'file_url' => $build->file_url,
        ]);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("RebuildSiteScriptJob: failed for site {$this->siteId}.", [
            'error' => $e->getMessage(),
        ]);
    }
}
