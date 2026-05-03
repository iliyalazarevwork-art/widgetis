<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Enums\DemoEntrySource;
use App\WidgetRuntime\Models\DemoEntry;
use App\WidgetRuntime\Models\DemoSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DemoSessionController extends BaseController
{
    /**
     * GET /api/v1/demo-sessions/{code}
     * Fetch an active demo session by its code.
     *
     * The per-session module list was removed: demo widgets are now a fixed
     * set baked into the obfuscated bundle served by site-proxy. The response
     * carries only what the frontend still needs — the code, the target
     * domain, and the expiry timestamp.
     */
    public function show(string $code): JsonResponse
    {
        $session = DemoSession::where('code', strtoupper($code))
            ->active()
            ->first();

        if ($session === null) {
            return $this->error('DEMO_NOT_FOUND', 'Demo session not found or expired.', 404);
        }

        $session->increment('view_count');

        return $this->success([
            'data' => [
                'code' => $session->code,
                'domain' => $session->domain,
                'expires_at' => $session->expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * POST /api/v1/demo-sessions
     * Create a public demo session (from landing "Безкоштовне демо" button).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
        ]);

        $domain = strtolower(trim($validated['domain']));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim((string) $domain, '/');

        if (! $this->isAllowedDomain($domain)) {
            return $this->error('INVALID_DOMAIN', 'Please enter a valid public domain.', 422);
        }

        $session = DemoSession::create([
            'code' => DemoSession::generateCode(),
            'domain' => $domain,
            'config' => ['modules' => []],
            'expires_at' => now()->addHours(24),
        ]);

        DemoEntry::create([
            'domain' => $domain,
            'source' => DemoEntrySource::Public,
            'ip' => $request->ip(),
        ]);

        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $link = "{$frontendUrl}/live-demo?code={$session->code}";

        return $this->created([
            'data' => [
                'code' => $session->code,
                'domain' => $session->domain,
                'link' => $link,
                'expires_at' => $session->expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Validate domain is a safe public domain (mirrors SiteProxyController logic).
     */
    private function isAllowedDomain(string $domain): bool
    {
        if (! Str::contains($domain, '.')) {
            return false;
        }

        if (preg_match('/^\d{1,3}(\.\d{1,3}){3}$/', $domain) === 1) {
            return false;
        }

        if (preg_match('/^\[|^::|^0x/i', $domain) === 1) {
            return false;
        }

        $lower = Str::lower($domain);

        if ($lower === 'localhost' || Str::endsWith($lower, '.localhost')) {
            return false;
        }

        foreach (['.local', '.internal', '.test', '.invalid', '.example'] as $suffix) {
            if (Str::endsWith($lower, $suffix)) {
                return false;
            }
        }

        if (Str::startsWith($lower, '169.254.') || $lower === 'metadata.google.internal') {
            return false;
        }

        return true;
    }
}
