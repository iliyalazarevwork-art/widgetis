<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Core\Models\User;
use App\Enums\UserRole;
use App\Shared\Contracts\WidgetConfigValidatorInterface;
use App\WidgetRuntime\DataTransferObjects\WidgetConfigValidationResult;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminDemoSessionTest extends TestCase
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

    public function test_admin_demo_session_returns_only_enabled_widget_ids_and_public_config_filters_disabled_modules(): void
    {
        $this->app->instance(WidgetConfigValidatorInterface::class, new class () implements WidgetConfigValidatorInterface {
            public function validate(array $payload): WidgetConfigValidationResult
            {
                return new WidgetConfigValidationResult(true, ['buyer-count'], []);
            }
        });

        $admin = $this->admin();

        $response = $this->actingAs($admin, 'core')
            ->postJson('/api/v1/admin/demo-sessions', [
                'domain' => 'benihome.com.ua',
                'config' => [
                    'modules' => [
                        'module-buyer-count' => [
                            'is_enabled' => true,
                            'config' => [
                                'enabled' => true,
                                'selectors' => [],
                            ],
                            'i18n' => [],
                        ],
                        'module-cart-goal' => [
                            'is_enabled' => false,
                            'config' => [
                                'enabled' => false,
                            ],
                            'i18n' => [],
                        ],
                    ],
                ],
            ])
            ->assertCreated();

        $response->assertJsonPath('data.widget_ids', ['buyer-count']);

        $code = $response->json('data.code');
        $this->assertIsString($code);

        $this->getJson("/api/v1/demo-sessions/{$code}/config")
            ->assertOk()
            ->assertJsonPath('data.config.modules.buyer-count.is_enabled', true)
            ->assertJsonMissingPath('data.config.modules.cart-goal');
    }
}
