<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Enums\DemoEntrySource;
use App\WidgetRuntime\Models\DemoEntry;
use App\WidgetRuntime\Models\DemoSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DemoSessionController extends BaseController
{
    /**
     * POST /api/v1/admin/demo-sessions
     * Create a demo session from the admin Configurator.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
            'config' => 'required|array',
            'config.modules' => 'required|array|min:1',
            'expires_hours' => 'sometimes|integer|min:1|max:720',
        ]);

        $domain = strtolower(trim($validated['domain']));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim((string) $domain, '/');

        $expiresHours = (int) ($validated['expires_hours'] ?? 72);

        $session = DemoSession::create([
            'code' => DemoSession::generateCode(),
            'domain' => $domain,
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
                'widget_ids' => $widgetIds,
                'link' => $link,
                'expires_at' => $session->expires_at?->toIso8601String(),
            ],
        ]);
    }
}
