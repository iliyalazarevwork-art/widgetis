<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

final class WidgetBuilderController extends BaseController
{
    private function builderUrl(): string
    {
        return rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');
    }

    public function modules(): JsonResponse
    {
        try {
            $response = Http::timeout(15)->get("{$this->builderUrl()}/modules");
        } catch (ConnectionException $e) {
            return $this->error('WIDGET_BUILDER_UNAVAILABLE', "Connection error: {$e->getMessage()}", 502);
        }

        if (! $response->successful()) {
            return $this->error('WIDGET_BUILDER_FAILED', "HTTP {$response->status()}", 502);
        }

        /** @var array<string, mixed> $schemas */
        $schemas = $response->json() ?? [];

        return $this->success(['data' => $schemas]);
    }

    public function build(Request $request): JsonResponse
    {
        $request->validate([
            'modules' => ['required', 'array'],
            'site' => ['sometimes', 'string', 'max:253'],
        ]);

        try {
            $response = Http::timeout(120)->post("{$this->builderUrl()}/build", [
                'modules' => $request->input('modules'),
            ]);
        } catch (ConnectionException $e) {
            return $this->error('WIDGET_BUILDER_UNAVAILABLE', "Connection error: {$e->getMessage()}", 502);
        }

        if (! $response->successful()) {
            return $this->error('WIDGET_BUILDER_FAILED', "HTTP {$response->status()}: {$response->body()}", 502);
        }

        $js = $response->body();

        return $this->success([
            'data' => [
                'js' => $js,
                'size' => strlen($js),
            ],
        ]);
    }
}
