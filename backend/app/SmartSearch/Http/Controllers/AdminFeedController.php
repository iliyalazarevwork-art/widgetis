<?php

declare(strict_types=1);

namespace App\SmartSearch\Http\Controllers;

use App\Http\Controllers\Api\V1\BaseController;
use App\Shared\Contracts\SiteOwnershipInterface;
use App\Shared\ValueObjects\SiteId;
use App\Shared\ValueObjects\UserId;
use App\SmartSearch\Enums\FeedSyncStatus;
use App\SmartSearch\Http\Requests\UpdateFeedRequest;
use App\SmartSearch\Jobs\ImportSiteFeedJob;
use App\SmartSearch\Models\SiteSearchCategory;
use App\SmartSearch\Models\SiteSearchFeed;
use App\SmartSearch\Models\SiteSearchProduct;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

final class AdminFeedController extends BaseController
{
    public function __construct(
        private readonly SiteOwnershipInterface $siteOwnership,
    ) {
    }

    public function index(string $siteId): JsonResponse
    {
        if (! $this->canAccessSite($siteId)) {
            return $this->error('FORBIDDEN', 'Access denied.', 403);
        }

        $feeds = SiteSearchFeed::where('site_id', $siteId)
            ->orderBy('lang')
            ->get();

        return $this->success(['data' => $feeds->toArray()]);
    }

    public function update(UpdateFeedRequest $request, string $siteId): JsonResponse
    {
        if (! $this->canAccessSite($siteId)) {
            return $this->error('FORBIDDEN', 'Access denied.', 403);
        }

        $site = Site::find($siteId);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $lang = $request->string('lang')->toString();

        $feed = SiteSearchFeed::firstOrNew(['site_id' => $siteId, 'lang' => $lang]);

        $isNew = ! $feed->exists;

        if ($isNew) {
            $feed->id = Str::uuid7()->toString();
        }

        $feed->fill([
            'feed_url'    => $request->string('feed_url')->toString(),
            'sitemap_url' => $request->filled('sitemap_url') ? $request->string('sitemap_url')->toString() : null,
            'status'      => FeedSyncStatus::Idle,
        ]);

        $feed->save();

        ImportSiteFeedJob::dispatch($feed->id);

        return $isNew
            ? $this->created(['data' => $feed->toArray()])
            : $this->success(['data' => $feed->fresh()?->toArray()]);
    }

    public function destroy(string $siteId, string $lang): JsonResponse
    {
        if (! $this->canAccessSite($siteId)) {
            return $this->error('FORBIDDEN', 'Access denied.', 403);
        }

        $feed = SiteSearchFeed::where('site_id', $siteId)->where('lang', $lang)->first();

        if ($feed === null) {
            return $this->error('NOT_FOUND', 'Feed not found.', 404);
        }

        SiteSearchProduct::where('site_id', $siteId)->where('lang', $lang)->delete();
        SiteSearchCategory::where('site_id', $siteId)->where('lang', $lang)->delete();
        $feed->delete();

        return $this->noContent();
    }

    public function sync(string $siteId, string $lang): JsonResponse
    {
        if (! $this->canAccessSite($siteId)) {
            return $this->error('FORBIDDEN', 'Access denied.', 403);
        }

        $feed = SiteSearchFeed::where('site_id', $siteId)->where('lang', $lang)->first();

        if ($feed === null) {
            return $this->error('NOT_FOUND', 'Feed not found.', 404);
        }

        ImportSiteFeedJob::dispatch($feed->id);

        return $this->success(['message' => 'Sync job dispatched.'], 202);
    }

    public function stats(string $siteId): JsonResponse
    {
        if (! $this->canAccessSite($siteId)) {
            return $this->error('FORBIDDEN', 'Access denied.', 403);
        }

        $feeds = SiteSearchFeed::where('site_id', $siteId)->get();

        $stats = $feeds->map(static fn (SiteSearchFeed $feed): array => [
            'lang'           => $feed->lang,
            'status'         => $feed->status->value,
            'items_count'    => $feed->items_count,
            'last_synced_at' => $feed->last_synced_at?->toIso8601String(),
            'error'          => $feed->error,
            'products_count' => SiteSearchProduct::where('site_id', $siteId)->where('lang', $feed->lang)->count(),
            'categories_count' => SiteSearchCategory::where('site_id', $siteId)->where('lang', $feed->lang)->count(),
        ]);

        return $this->success(['data' => $stats->toArray()]);
    }

    private function canAccessSite(string $siteId): bool
    {
        // Admins (role:admin) can access any site; customers only their own.
        if (auth('core')->user()?->hasRole('admin')) {
            return true;
        }

        $userId = UserId::fromString($this->authedUserId());

        return $this->siteOwnership->userOwnsSite($userId, SiteId::fromString($siteId));
    }
}
