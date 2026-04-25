<?php

declare(strict_types=1);

namespace Tests\Feature\Widget\SmsOtp;

use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WidgetSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_issues_token_for_valid_site_key_and_origin(): void
    {
        $origin = 'https://myshop.com';
        $site = Site::factory()->withOrigin($origin)->create();

        $response = $this->postJson('/api/v1/widget/session', [
            'siteKey' => $site->site_key,
        ], ['Origin' => $origin]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'expires_at']);
    }

    public function test_returns_404_for_unknown_site_key(): void
    {
        $response = $this->postJson('/api/v1/widget/session', [
            'siteKey' => '00000000-0000-0000-0000-000000000000',
        ], ['Origin' => 'https://myshop.com']);

        $response->assertNotFound();
    }

    public function test_returns_403_when_origin_not_in_allowed_list(): void
    {
        $site = Site::factory()->withOrigin('https://allowed.com')->create();

        $response = $this->postJson('/api/v1/widget/session', [
            'siteKey' => $site->site_key,
        ], ['Origin' => 'https://evil.com']);

        $response->assertForbidden();
    }

    public function test_returns_403_when_origin_header_missing(): void
    {
        $site = Site::factory()->withOrigin('https://myshop.com')->create();

        $response = $this->postJson('/api/v1/widget/session', [
            'siteKey' => $site->site_key,
        ]);

        $response->assertForbidden();
    }

    public function test_returns_422_when_site_key_missing(): void
    {
        $response = $this->postJson('/api/v1/widget/session', [], ['Origin' => 'https://myshop.com']);

        $response->assertUnprocessable();
    }

    public function test_returns_422_when_site_key_not_uuid(): void
    {
        $response = $this->postJson('/api/v1/widget/session', [
            'siteKey' => 'not-a-uuid',
        ], ['Origin' => 'https://myshop.com']);

        $response->assertUnprocessable();
    }
}
