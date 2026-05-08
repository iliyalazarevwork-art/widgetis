<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\Shared\Contracts\WidgetConfigValidatorInterface;
use App\WidgetRuntime\Enums\DemoEntrySource;
use App\WidgetRuntime\Exceptions\WidgetConfigValidatorUnavailableException;
use App\WidgetRuntime\Models\DemoEntry;
use App\WidgetRuntime\Models\DemoSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DemoSessionController extends BaseController
{
    public function __construct(
        private readonly WidgetConfigValidatorInterface $configValidator,
    ) {
    }

    /**
     * Hard cap on the per-session config payload. The runtime is shipped
     * verbatim into an inline <script> on the proxied page, so any size
     * abuse here directly bloats every demo iframe load. Tightly bounded
     * defense-in-depth: even a compromised admin can't make site-proxy
     * embed a multi-megabyte payload.
     */
    private const MAX_CONFIG_BYTES = 64 * 1024;

    /**
     * POST /api/v1/admin/demo-sessions
     * Create a demo session from the admin Configurator.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
            // Optional deep-link path inside the merchant site (e.g. "/p/some-slug").
            // Must start with "/", reject anything that could be parsed as a different
            // origin or directory traversal (//, scheme, "..", control chars).
            'landing_path' => ['sometimes', 'nullable', 'string', 'max:2048', 'regex:/^\/(?!\/)[^\s\x00-\x1f]*$/u', 'not_regex:/(^|\/)\.\.($|\/)/'],
            'config' => 'required|array',
            'config.modules' => 'required|array|min:1',
            'config.modules.*' => 'array',
            'config.modules.*.is_enabled' => 'sometimes|boolean',
            'config.modules.*.config' => 'sometimes|array',
            'config.modules.*.i18n' => 'sometimes|array',
            'config.brand' => 'sometimes|array',
            'config.brand.primary_color' => 'sometimes|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'config.brand.accent_color' => 'sometimes|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'config.brand.text_color' => 'sometimes|string|regex:/^#[0-9A-Fa-f]{3,8}$/',
            'expires_hours' => 'sometimes|integer|min:1|max:720',
        ]);

        $configJson = json_encode($validated['config']);
        if ($configJson === false || strlen($configJson) > self::MAX_CONFIG_BYTES) {
            return $this->error('CONFIG_TOO_LARGE', 'Demo config exceeds size limit.', 422);
        }

        // Schema-validate every per-widget config/i18n override against the
        // real Zod schemas in widget-builder. Without this, an admin who
        // ships, say, `borderRadius: 8` (number when the schema says
        // string) creates a session that crashes the bundle in the
        // merchant's browser. Fail-closed: if widget-builder is down, we
        // 503 rather than persist an unvalidated payload.
        try {
            $validation = $this->configValidator->validate($validated['config']);
        } catch (WidgetConfigValidatorUnavailableException $e) {
            Log::error('demo-session validator unavailable', ['message' => $e->getMessage()]);

            return $this->error(
                'VALIDATOR_UNAVAILABLE',
                'Widget config validator is temporarily unavailable. Please retry.',
                503,
            );
        }
        if (! $validation->ok) {
            return $this->error(
                'WIDGET_CONFIG_INVALID',
                'One or more widget configs failed schema validation.',
                422,
                ['issues' => $validation->errors],
            );
        }

        $domain = strtolower(trim($validated['domain']));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim((string) $domain, '/');

        $expiresHours = (int) ($validated['expires_hours'] ?? 72);

        $session = DemoSession::create([
            'code' => DemoSession::generateCode(),
            'domain' => $domain,
            'landing_path' => $validated['landing_path'] ?? null,
            'config' => $validated['config'],
            'created_by' => auth('core')->id(),
            'expires_at' => now()->addHours($expiresHours),
        ]);

        DemoEntry::create([
            'domain' => $domain,
            'source' => DemoEntrySource::Admin,
            'ip' => $request->ip(),
        ]);

        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $link = "{$frontendUrl}/live-demo?code={$session->code}";

        $widgetIds = collect($session->config['modules'] ?? [])
            ->keys()
            ->map(fn (string $id): string => str_replace('module-', '', $id))
            ->values()
            ->all();

        return $this->created([
            'data' => [
                'code' => $session->code,
                'domain' => $session->domain,
                'landing_path' => $session->landing_path,
                'widget_ids' => $widgetIds,
                'link' => $link,
                'expires_at' => $session->expires_at?->toIso8601String(),
            ],
        ]);
    }
}
