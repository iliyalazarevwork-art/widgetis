<?php

declare(strict_types=1);

namespace App\Services\User;

use App\Models\ActivityLog;
use App\Models\ManagerRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\WidgetRuntime\Models\Review;
use App\WidgetRuntime\Models\Site;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UserDeletionService
{
    /**
     * Permanently delete a user account, all related domain data,
     * and every R2 bundle that belongs to the user's sites.
     *
     * Handles both cascading FKs (sites → scripts/widgets/builds,
     * notifications, subscriptions, social accounts) and non-cascading
     * FKs (orders, payments, reviews, manager_requests, activity_log),
     * which would otherwise block a hard delete.
     */
    public function delete(User $user): void
    {
        $sites = $user->sites()->with('script:id,site_id,token')->get(['id', 'domain']);

        foreach ($sites as $site) {
            $this->deleteSiteBundleFromR2($site);
        }

        DB::transaction(function () use ($user): void {
            Payment::where('user_id', $user->id)->delete();
            Order::where('user_id', $user->id)->delete();
            Review::where('user_id', $user->id)->delete();
            ManagerRequest::where('user_id', $user->id)->forceDelete();
            ActivityLog::where('user_id', $user->id)->delete();

            $user->delete();
        });

        Log::info('UserDeletionService: user permanently deleted.', [
            'user_id' => $user->id,
            'email' => $user->email,
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
            Log::warning('UserDeletionService: failed to delete R2 bundle.', [
                'site_id' => $site->id,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
