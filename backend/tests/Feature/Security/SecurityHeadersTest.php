<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use Tests\TestCase;

/**
 * The SecurityHeaders middleware is globally registered — any response from
 * the API should carry the hardening headers. This test pins that set so a
 * refactor that drops the middleware from the stack fails loudly.
 */
class SecurityHeadersTest extends TestCase
{
    public function test_health_endpoint_emits_hardening_headers(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        $hsts = (string) $response->headers->get('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=', $hsts);
        $this->assertStringContainsString('includeSubDomains', $hsts);
    }
}
