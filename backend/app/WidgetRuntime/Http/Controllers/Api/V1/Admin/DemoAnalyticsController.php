<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Enums\DemoEntrySource;
use App\WidgetRuntime\Models\DemoEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class DemoAnalyticsController extends BaseController
{
    /**
     * GET /api/v1/admin/demo-analytics
     * Returns top domains and daily totals for all demo entries.
     */
    public function index(): JsonResponse
    {
        $db = DB::connection('pgsql_runtime')->table('wgt_demo_entries');

        /** @var list<array{domain: string, count: int}> $topDomains */
        $topDomains = (clone $db)
            ->select('domain', DB::raw('COUNT(*) as count'))
            ->groupBy('domain')
            ->orderByDesc('count')
            ->limit(50)
            ->get()
            ->map(fn (object $row): array => [
                'domain' => (string) $row->domain,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        /** @var list<array{date: string, count: int}> $byDay */
        $byDay = (clone $db)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderByDesc('date')
            ->limit(90)
            ->get()
            ->map(fn (object $row): array => [
                'date' => (string) $row->date,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $total = DemoEntry::count();
        $totalPublic = DemoEntry::where('source', DemoEntrySource::Public)->count();
        $totalAdmin = DemoEntry::where('source', DemoEntrySource::Admin)->count();

        return $this->success([
            'data' => [
                'total' => $total,
                'total_public' => $totalPublic,
                'total_admin' => $totalAdmin,
                'top_domains' => $topDomains,
                'by_day' => $byDay,
            ],
        ]);
    }
}
