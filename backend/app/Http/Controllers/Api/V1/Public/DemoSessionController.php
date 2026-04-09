<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\DemoSession;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class DemoSessionController extends BaseController
{
    /**
     * GET /api/v1/demo-sessions/{code}
     * Fetch an active demo session by its code.
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

        $widgetIds = collect($session->config['modules'] ?? [])
            ->keys()
            ->map(fn (string $id): string => str_replace('module-', '', $id))
            ->values()
            ->all();

        return $this->success([
            'data' => [
                'code' => $session->code,
                'domain' => $session->domain,
                'widget_ids' => $widgetIds,
                'config' => $session->config,
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

        $modules = $this->getDefaultModules();

        $session = DemoSession::create([
            'code' => DemoSession::generateCode(),
            'domain' => $domain,
            'config' => ['modules' => $modules],
            'expires_at' => now()->addHours(24),
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
     * POST /api/v1/demo-build
     * Build widget JS for a demo session.
     */
    public function build(Request $request): Response
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10',
            'enabled_widgets' => 'sometimes|array',
            'enabled_widgets.*' => 'string|max:50',
        ]);

        $session = DemoSession::where('code', strtoupper($validated['code']))
            ->active()
            ->first();

        if ($session === null) {
            return $this->error('DEMO_NOT_FOUND', 'Demo session not found or expired.', 404);
        }

        $allModules = $session->config['modules'] ?? [];

        // Filter by enabled_widgets if provided
        if (isset($validated['enabled_widgets'])) {
            /** @var list<string> $enabledList */
            $enabledList = $validated['enabled_widgets'];
            $enabledSet = array_flip(array_map(
                fn (string $id): string => str_starts_with($id, 'module-') ? $id : "module-{$id}",
                $enabledList,
            ));

            $allModules = array_filter(
                $allModules,
                fn (string $key): bool => isset($enabledSet[$key]),
                ARRAY_FILTER_USE_KEY,
            );
        }

        if (empty($allModules)) {
            return response('/* widgetis: no active widgets */', 200)
                ->header('Content-Type', 'application/javascript');
        }

        $builderUrl = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        try {
            $resp = Http::timeout(30)
                ->withBody((string) json_encode(['modules' => $allModules], JSON_UNESCAPED_UNICODE), 'application/json')
                ->post("{$builderUrl}/build");

            if (! $resp->successful()) {
                Log::error('DemoSession build failed', [
                    'code' => $session->code,
                    'status' => $resp->status(),
                    'body' => $resp->body(),
                ]);

                return $this->error('BUILD_FAILED', 'Widget build failed.', 502);
            }

            return response($resp->body(), 200)
                ->header('Content-Type', 'application/javascript');
        } catch (\Throwable $e) {
            Log::error('DemoSession build exception', [
                'code' => $session->code,
                'error' => $e->getMessage(),
            ]);

            return $this->error('BUILD_FAILED', 'Widget build service unavailable.', 502);
        }
    }

    /**
     * Get default widget modules (all active products with builder_module).
     *
     * @return array<string, array{config: array<string, mixed>, i18n: array<string, mixed>}>
     */
    private function getDefaultModules(): array
    {
        $products = Product::active()
            ->whereNotNull('builder_module')
            ->where('builder_module', '!=', '')
            ->limit(4)
            ->orderBy('sort_order')
            ->get();

        $builderUrl = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        try {
            $resp = Http::timeout(10)->get("{$builderUrl}/modules");
            /** @var array<string, array{defaultConfig?: array<string, mixed>, defaultI18n?: mixed}> $schemas */
            $schemas = $resp->successful() ? ($resp->json() ?? []) : [];
        } catch (\Throwable) {
            $schemas = [];
        }

        $modules = [];

        foreach ($products as $product) {
            $moduleName = "module-{$product->slug}";
            $schema = $schemas[$moduleName] ?? null;

            $config = $schema['defaultConfig'] ?? ['enabled' => true];
            $i18n = $schema['defaultI18n'] ?? [];

            if (is_array($config)) {
                $config['enabled'] = true;
            }

            $modules[$moduleName] = [
                'config' => $config,
                'i18n' => $i18n,
            ];
        }

        return $modules;
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
