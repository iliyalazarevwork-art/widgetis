<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Core\Models\User;
use App\Enums\UserRole;
use App\Shared\Contracts\WidgetConfigValidatorInterface;
use App\WidgetRuntime\DataTransferObjects\WidgetConfigValidationResult;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * N2ED flow: create demo session → fetch config by code → build widget script.
 *
 * Verifies that the modules returned by the public config endpoint
 * are directly usable as input to the admin build endpoint — no manual
 * conversion or reshaping required.
 */
class DemoCodeToBuildTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (! Schema::connection('pgsql_runtime')->hasTable('wgt_demo_entries')) {
            Schema::connection('pgsql_runtime')->create('wgt_demo_entries', function (Blueprint $table): void {
                $table->id();
                $table->string('domain');
                $table->string('source', 16);
                $table->string('ip', 45)->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Admin->value);

        return $user;
    }

    private function mockValidator(array $enabledSlugs = ['buyer-count', 'cart-goal']): void
    {
        $this->app->instance(
            WidgetConfigValidatorInterface::class,
            new class ($enabledSlugs) implements WidgetConfigValidatorInterface {
                public function __construct(private readonly array $slugs)
                {
                }

                public function validate(array $payload): WidgetConfigValidationResult
                {
                    return new WidgetConfigValidationResult(true, $this->slugs, []);
                }
            },
        );
    }

    public function test_demo_code_to_build_full_flow(): void
    {
        $this->mockValidator(['buyer-count', 'cart-goal']);

        Http::fake([
            '*/build' => Http::response('(function(){/* widget */})();', 200),
        ]);

        $admin = $this->admin();

        // N — create demo session, receive code
        $createResp = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/demo-sessions', [
                'domain' => 'ballistic.com.ua',
                'config' => [
                    'modules' => [
                        'buyer-count' => [
                            'is_enabled' => true,
                            'config' => [
                                'enabled' => true,
                                'minCount' => 8,
                                'maxCount' => 50,
                                'backgroundColor' => '#4c1d95',
                                'textColor' => '#ede9fe',
                            ],
                            'i18n' => ['ua' => ['label' => 'людей купили цей товар']],
                        ],
                        'cart-goal' => [
                            'is_enabled' => true,
                            'config' => [
                                'enabled' => true,
                                'background' => '#172554',
                                'textColor' => '#bfdbfe',
                                'positionMobile' => ['left' => 16, 'bottom' => 74],
                            ],
                            'i18n' => ['ua' => ['text' => 'До безкоштовної доставки']],
                        ],
                        'one-plus-one' => [
                            'is_enabled' => false,
                            'config' => ['enabled' => false],
                            'i18n' => [],
                        ],
                    ],
                ],
            ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['code', 'link']]);

        $code = $createResp->json('data.code');
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{6}$/', $code);

        // 2 — fetch config by code (public endpoint, no auth)
        $configResp = $this->getJson("/api/v1/demo-sessions/{$code}/config")
            ->assertOk()
            ->assertJsonStructure(['data' => ['config' => ['modules']]]);

        $modules = $configResp->json('data.config.modules');

        // Only enabled modules are returned
        $this->assertArrayHasKey('buyer-count', $modules);
        $this->assertArrayHasKey('cart-goal', $modules);
        $this->assertArrayNotHasKey('one-plus-one', $modules);

        // E — modules from config endpoint must be valid input for the build endpoint
        $this->assertIsArray($modules['buyer-count']);
        $this->assertTrue($modules['buyer-count']['is_enabled']);
        $this->assertArrayHasKey('config', $modules['buyer-count']);

        // D — build the widget script using the modules from the config endpoint
        $buildResp = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/widget-builder/build', [
                'modules' => $modules,
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['js', 'size']]);

        $js = $buildResp->json('data.js');
        $this->assertNotEmpty($js);
        $this->assertIsInt($buildResp->json('data.size'));

        Http::assertSent(function ($request) use ($modules) {
            return str_ends_with($request->url(), '/build')
                && $request['modules'] === $modules;
        });
    }

    public function test_config_endpoint_returns_only_enabled_modules_for_build(): void
    {
        $this->mockValidator(['promo-line']);

        $admin = $this->admin();

        $createResp = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/demo-sessions', [
                'domain' => 'example.com.ua',
                'config' => [
                    'modules' => [
                        'promo-line' => ['is_enabled' => true, 'config' => ['enabled' => true], 'i18n' => []],
                        'cart-goal' => ['is_enabled' => false, 'config' => ['enabled' => false], 'i18n' => []],
                    ],
                ],
            ])
            ->assertCreated();

        $code = $createResp->json('data.code');

        $modules = $this->getJson("/api/v1/demo-sessions/{$code}/config")
            ->assertOk()
            ->json('data.config.modules');

        // Disabled modules are stripped — build payload stays lean
        $this->assertArrayHasKey('promo-line', $modules);
        $this->assertArrayNotHasKey('cart-goal', $modules);
        $this->assertCount(1, $modules);
    }

    public function test_sf8byx_ballistic_config_survives_full_n2ed_pipeline(): void
    {
        // Slugs that are is_enabled:true in the SF8BYX session (14 modules).
        $enabledSlugs = [
            'cart-goal', 'phone-mask', 'promo-line', 'prize-banner', 'trust-badges',
            'video-preview', 'spin-the-wheel', 'cart-recommender', 'promo-auto-apply',
            'sms-otp-checkout', 'last-chance-popup', 'sticky-buy-button',
            'photo-video-reviews', 'progressive-discount',
        ];

        $this->mockValidator($enabledSlugs);

        Http::fake([
            '*/build' => Http::response('(function(){/* ballistic */})();', 200),
        ]);

        $admin = $this->admin();

        // Exact SF8BYX config — verbatim payload the agent produced.
        $sf8byxModules = [
            'cart-goal' => [
                'is_enabled' => true,
                'config' => ['textColor' => '#ffffff', 'background' => '#522600', 'positionMobile' => ['bottom' => 74], 'achievedBackground' => '#15803d'],
                'i18n' => [],
            ],
            'phone-mask' => ['is_enabled' => true],
            'promo-line' => [
                'is_enabled' => true,
                'config' => ['colors' => ['mobile' => ['textColor' => '#ffffff', 'backgroundColor' => '#843d00'], 'desktop' => ['textColor' => '#ffffff', 'backgroundColor' => '#843d00']]],
                'i18n' => [],
            ],
            'prize-banner' => [
                'is_enabled' => true,
                'config' => ['textColor' => '#0f0f0f', 'accentColor' => '#b85500', 'borderColor' => '#eaccb3', 'borderRadius' => 12, 'backgroundColor' => '#f8f5f2'],
                'i18n' => [],
            ],
            'trust-badges' => [
                'is_enabled' => true,
                'config' => ['iconColor' => '#b85500', 'textColor' => '#0f0f0f', 'showBorder' => true, 'borderColor' => '#e8e5e3', 'borderRadius' => 12, 'backgroundColor' => 'transparent'],
                'i18n' => [],
            ],
            'video-preview' => ['is_enabled' => true],
            'spin-the-wheel' => [
                'is_enabled' => true,
                'config' => [
                    'palette' => ['#b85500', '#522600', '#b85500', '#522600', '#b85500', '#522600'],
                    'textColor' => '#0f0f0f', 'accentColor' => '#b85500', 'borderColor' => '#e8e5e3',
                    'borderRadius' => 16, 'wheelTextColor' => '#ffffff', 'accentTextColor' => '#ffffff',
                    'backgroundColor' => '#ffffff', 'decorativeColor' => '#DC2626',
                ],
                'i18n' => [],
            ],
            'cart-recommender' => [
                'is_enabled' => true,
                'config' => [
                    'doneColor' => '#15803d', 'textColor' => '#0f0f0f', 'priceColor' => '#843d00',
                    'accentColor' => '#b85500', 'borderColor' => '#e8e5e3', 'ctaTextColor' => '#ffffff',
                    'ctaBackground' => '#b85500', 'accentTextColor' => '#ffffff', 'backgroundColor' => '#ffffff',
                ],
                'i18n' => [],
            ],
            'promo-auto-apply' => ['is_enabled' => true],
            'sms-otp-checkout' => ['is_enabled' => true],
            'last-chance-popup' => [
                'is_enabled' => true,
                'config' => ['textColor' => '#0f0f0f', 'accentColor' => '#b85500', 'borderColor' => '#e8e5e3', 'borderRadius' => 16, 'accentTextColor' => '#ffffff', 'backgroundColor' => '#ffffff'],
                'i18n' => [],
            ],
            'sticky-buy-button' => [
                'is_enabled' => true,
                'config' => ['textColor' => '#ffffff', 'borderRadius' => '999px', 'backgroundColor' => '#b85500'],
                'i18n' => [],
            ],
            'photo-video-reviews' => ['is_enabled' => true],
            'progressive-discount' => [
                'is_enabled' => true,
                'config' => ['textColor' => '#ffffff', 'background' => '#522600', 'accentColor' => '#22c55e', 'achievedBackground' => '#15803d'],
                'i18n' => [],
            ],
            // Disabled in SF8BYX
            'stock-left' => ['is_enabled' => false],
            'buyer-count' => ['is_enabled' => false],
            'delivery-date' => ['is_enabled' => false],
            'one-plus-one' => ['is_enabled' => false],
            'minorder-goal' => ['is_enabled' => false],
        ];

        // N — create demo session with SF8BYX payload
        $createResp = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/demo-sessions', [
                'domain' => 'ballistic.com.ua',
                'config' => [
                    'brand' => ['primary_color' => '#b85500', 'accent_color' => '#000000'],
                    'modules' => $sf8byxModules,
                ],
            ])
            ->assertCreated();

        $code = $createResp->json('data.code');
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{6}$/', $code);

        // 2 — fetch config by code (no auth required)
        $modules = $this->getJson("/api/v1/demo-sessions/{$code}/config")
            ->assertOk()
            ->json('data.config.modules');

        // Only enabled modules survive — 14 out of 19
        $this->assertCount(14, $modules);
        foreach ($enabledSlugs as $slug) {
            $this->assertArrayHasKey($slug, $modules, "Expected enabled slug [{$slug}] in config response");
            $this->assertTrue($modules[$slug]['is_enabled'], "Expected is_enabled=true for [{$slug}]");
        }
        foreach (['stock-left', 'buyer-count', 'delivery-date', 'one-plus-one', 'minorder-goal'] as $slug) {
            $this->assertArrayNotHasKey($slug, $modules, "Expected disabled slug [{$slug}] to be absent");
        }

        // E — spot-check colour config round-trips intact
        $this->assertSame('#522600', $modules['cart-goal']['config']['background']);
        $this->assertSame(74, $modules['cart-goal']['config']['positionMobile']['bottom']);
        $this->assertSame('999px', $modules['sticky-buy-button']['config']['borderRadius']);
        $this->assertCount(6, $modules['spin-the-wheel']['config']['palette']);
        $this->assertSame('#b85500', $modules['spin-the-wheel']['config']['palette'][0]);

        // D — build using the modules exactly as returned by the config endpoint
        $buildResp = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/widget-builder/build', [
                'modules' => $modules,
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['js', 'size']]);

        $this->assertStringContainsString('ballistic', $buildResp->json('data.js'));

        Http::assertSent(function ($request) use ($modules) {
            return str_ends_with($request->url(), '/build')
                && $request['modules'] === $modules;
        });
    }

    public function test_build_endpoint_accepts_modules_shaped_like_config_endpoint_response(): void
    {
        Http::fake([
            '*/build' => Http::response('(()=>{})();', 200),
        ]);

        $admin = $this->admin();

        // Shape that the GET /demo-sessions/{code}/config endpoint returns
        $modulesFromConfigEndpoint = [
            'cart-goal' => [
                'is_enabled' => true,
                'config' => ['background' => '#172554', 'textColor' => '#bfdbfe'],
                'i18n' => ['ua' => ['text' => 'До безкоштовної доставки']],
            ],
        ];

        $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/widget-builder/build', [
                'modules' => $modulesFromConfigEndpoint,
            ])
            ->assertOk()
            ->assertJsonPath('data.js', '(()=>{})();');
    }
}
