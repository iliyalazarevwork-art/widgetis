<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Listeners;

use App\Shared\Events\User\Deleted;
use App\WidgetRuntime\Models\DemoSession;
use App\WidgetRuntime\Models\OtpProviderConfig;
use App\WidgetRuntime\Models\OtpRequest;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Models\UserWidgetGrant;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class PurgeSitesOnUserDeleted
{
    public function handle(Deleted $event): void
    {
        $userId = $event->userId->value;

        // Delete R2 bundles first
        $sites = Site::where('user_id', $userId)
            ->with('script:id,site_id,token')
            ->get(['id', 'domain']);

        foreach ($sites as $site) {
            $this->deleteSiteBundleFromR2($site);
        }

        // Cascade runtime data linked to user
        Review::where('user_id', $userId)->delete();
        UserWidgetGrant::where('user_id', $userId)->delete();
        DemoSession::where('created_by', $userId)->delete();

        // OtpProviderConfig and OtpRequest are linked to sites; cascade via site deletion below
        $siteIds = $sites->pluck('id')->all();

        if ($siteIds !== []) {
            OtpRequest::whereIn('site_id', $siteIds)->delete();
            OtpProviderConfig::whereIn('site_id', $siteIds)->delete();
        }

        // Site deletion cascades to SiteWidget, SiteScript, SiteScriptBuild
        Site::where('user_id', $userId)->delete();

        Log::info('PurgeSitesOnUserDeleted: runtime data purged.', [
            'user_id' => $userId,
            'sites' => $sites->pluck('domain')->all(),
        ]);
    }

    private function deleteSiteBundleFromR2(Site $site): void
    {
        if ($site->domain === '' || $site->script === null) {
            return;
        }

        $path = "sites/{$site->domain}/{$site->script->token}.js";

        try {
            Storage::disk('r2')->delete($path);
        } catch (Throwable $e) {
            Log::warning('PurgeSitesOnUserDeleted: failed to delete R2 bundle.', [
                'site_id' => $site->id,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
