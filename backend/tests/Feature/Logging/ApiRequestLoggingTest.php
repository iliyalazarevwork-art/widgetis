<?php

declare(strict_types=1);

namespace Tests\Feature\Logging;

use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class ApiRequestLoggingTest extends TestCase
{
    public function test_api_middleware_logs_request_in_and_out_with_request_id_header(): void
    {
        $channel = Mockery::mock();

        $channel->shouldReceive('info')
            ->once()
            ->withArgs(function (string $event, array $context): bool {
                return $event === 'api.request.in'
                    && ($context['method'] ?? null) === 'GET'
                    && ($context['path'] ?? null) === 'api/v1/health'
                    && is_array($context['input'] ?? null)
                    && isset($context['request_id']);
            });

        $channel->shouldReceive('info')
            ->once()
            ->withArgs(function (string $event, array $context): bool {
                return $event === 'api.request.out'
                    && ($context['method'] ?? null) === 'GET'
                    && ($context['status'] ?? null) === 200
                    && isset($context['duration_ms'])
                    && isset($context['request_id']);
            });

        Log::shouldReceive('channel')->with('api')->andReturn($channel)->twice();

        $response = $this->getJson('/api/v1/health');

        $response->assertOk();

        $requestId = $response->headers->get('X-Request-Id');
        $this->assertNotNull($requestId);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $requestId,
        );
    }

    public function test_api_middleware_masks_sensitive_input_fields(): void
    {
        $channel = Mockery::mock();

        $channel->shouldReceive('info')
            ->once()
            ->withArgs(function (string $event, array $context): bool {
                if ($event !== 'api.request.in') {
                    return false;
                }

                /** @var array<string, mixed> $input */
                $input = $context['input'] ?? [];

                return ($input['email'] ?? null) === 'user@example.com'
                    && ($input['code'] ?? null) === '[REDACTED]'
                    && ($input['token'] ?? null) === '[REDACTED]';
            });

        $channel->shouldReceive('info')
            ->once()
            ->withArgs(function (string $event, array $context): bool {
                return $event === 'api.request.out'
                    && ($context['status'] ?? null) === 200
                    && isset($context['request_id']);
            });
        Log::shouldReceive('channel')->with('api')->andReturn($channel)->twice();

        $response = $this->getJson('/api/v1/health?email=user@example.com&code=123456&token=secret-token');

        $response->assertStatus(200);
    }
}
