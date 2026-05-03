<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Widget;

use App\Enums\SiteStatus;
use App\WidgetRuntime\Jobs\RebuildSiteScriptJob;
use App\WidgetRuntime\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

final class ScriptPingController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $origin = $request->header('Origin') ?? $request->header('Referer');

        if ($origin !== null && $origin !== '') {
            $this->tryActivate($origin);
        }

        return $this->ok($origin);
    }

    private function tryActivate(string $origin): void
    {
        $host = $this->extractHost($origin);

        if ($host === null) {
            return;
        }

        $site = Site::where('domain', $host)->first();

        if ($site === null || $site->script_installed) {
            return;
        }

        $site->update([
            'script_installed' => true,
            'script_installed_at' => now(),
            'status' => SiteStatus::Active,
            'connected_at' => now(),
        ]);

        RebuildSiteScriptJob::dispatch($site->id);
    }

    private function extractHost(string $origin): ?string
    {
        $parsed = parse_url($origin);

        if (! is_array($parsed)) {
            return null;
        }

        $host = $parsed['host'] ?? null;

        if ($host === null || $host === '') {
            return null;
        }

        $host = strtolower((string) preg_replace('/:\d+$/', '', $host));
        $host = (string) preg_replace('/^www\./i', '', $host);

        return $host !== '' ? $host : null;
    }

    private function ok(?string $origin): Response
    {
        $response = response('', 200);

        if ($origin !== null && $origin !== '') {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
