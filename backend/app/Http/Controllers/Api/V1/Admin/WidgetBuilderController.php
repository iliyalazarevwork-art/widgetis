<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\BaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WidgetBuilderController extends BaseController
{
    public function modules(): JsonResponse
    {
        $url = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        $ch = curl_init("{$url}/modules");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
        ]);
        $response = (string) curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError !== '') {
            return $this->error('WIDGET_BUILDER_UNAVAILABLE', "Connection error: {$curlError}", 502);
        }

        if ($httpStatus !== 200) {
            return $this->error('WIDGET_BUILDER_FAILED', "HTTP {$httpStatus}", 502);
        }

        /** @var array<string, mixed> $schemas */
        $schemas = json_decode($response, true) ?? [];

        return $this->success(['data' => $schemas]);
    }

    public function build(Request $request): JsonResponse
    {
        $request->validate([
            'modules' => ['required', 'array'],
            'obfuscate' => ['sometimes', 'boolean'],
            'site' => ['sometimes', 'string', 'max:253'],
        ]);

        $url = rtrim((string) config('services.widget_builder.url', 'http://widget-builder:3200'), '/');

        $payload = (string) json_encode([
            'modules' => $request->input('modules'),
            'obfuscate' => $request->boolean('obfuscate', false),
        ], JSON_UNESCAPED_UNICODE);

        $ch = curl_init("{$url}/build");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 120,
        ]);

        $response = (string) curl_exec($ch);
        $httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError !== '') {
            return $this->error('WIDGET_BUILDER_UNAVAILABLE', "Connection error: {$curlError}", 502);
        }

        if ($httpStatus !== 200) {
            return $this->error('WIDGET_BUILDER_FAILED', "HTTP {$httpStatus}: {$response}", 502);
        }

        return $this->success([
            'data' => [
                'js' => $response,
                'size' => strlen($response),
            ],
        ]);
    }
}
