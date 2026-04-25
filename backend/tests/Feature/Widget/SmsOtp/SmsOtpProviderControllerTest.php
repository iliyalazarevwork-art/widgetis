<?php

declare(strict_types=1);

namespace Tests\Feature\Widget\SmsOtp;

use App\Core\Models\User;
use App\Enums\UserRole;
use App\WidgetRuntime\Models\OtpProviderConfig;
use App\WidgetRuntime\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmsOtpProviderControllerTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Customer->value);

        return $user;
    }

    public function test_guest_cannot_list_providers(): void
    {
        $response = $this->getJson('/api/v1/profile/widgets/sms-otp/providers?site_id=fake');

        $response->assertUnauthorized();
    }

    public function test_customer_can_list_providers_for_own_site(): void
    {
        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);
        OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->getJson("/api/v1/profile/widgets/sms-otp/providers?site_id={$site->id}");

        $response->assertOk()
            ->assertJsonCount(1);
    }

    public function test_customer_cannot_list_providers_for_other_user_site(): void
    {
        $user = $this->makeCustomer();
        $other = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $other->id]);
        OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->getJson("/api/v1/profile/widgets/sms-otp/providers?site_id={$site->id}");

        $response->assertNotFound();
    }

    public function test_customer_can_create_provider_config(): void
    {
        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'core')
            ->postJson('/api/v1/profile/widgets/sms-otp/providers', [
                'site_id' => $site->id,
                'provider' => 'turbosms',
                'credentials' => ['token' => 'my-turbosms-token-1234567890'],
                'sender_name' => 'MyShop',
                'templates' => ['uk' => 'Код: {code}', 'en' => 'Code: {code}'],
                'is_active' => true,
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['id', 'site_id', 'provider', 'channel', 'sender_name']);
    }

    public function test_create_validates_required_fields(): void
    {
        $user = $this->makeCustomer();

        $response = $this->actingAs($user, 'core')
            ->postJson('/api/v1/profile/widgets/sms-otp/providers', []);

        $response->assertUnprocessable();
    }

    public function test_create_validates_turbosms_credential_token(): void
    {
        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user, 'core')
            ->postJson('/api/v1/profile/widgets/sms-otp/providers', [
                'site_id' => $site->id,
                'provider' => 'turbosms',
                'credentials' => ['token' => 'short'],
                'sender_name' => 'Shop',
                'templates' => ['uk' => 'Код: {code}'],
            ]);

        $response->assertUnprocessable();
        $details = $response->json('error.details');
        $this->assertNotEmpty($details, 'Expected validation details to be non-empty');
        // Credentials.token can be nested as "credentials.token" key
        $hasCredentialError = isset($details['credentials.token']) || isset($details['credentials']['token']);
        $this->assertTrue($hasCredentialError, 'Expected validation error for credentials.token');
    }

    public function test_customer_cannot_create_provider_for_other_user_site(): void
    {
        $user = $this->makeCustomer();
        $other = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($user, 'core')
            ->postJson('/api/v1/profile/widgets/sms-otp/providers', [
                'site_id' => $site->id,
                'provider' => 'turbosms',
                'credentials' => ['token' => 'my-turbosms-token-1234567890'],
                'sender_name' => 'Shop',
                'templates' => ['uk' => 'Код: {code}'],
            ]);

        $response->assertNotFound();
    }

    public function test_customer_can_update_own_provider(): void
    {
        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->putJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}", [
                'sender_name' => 'NewName',
                'is_active' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('sender_name', 'NewName')
            ->assertJsonPath('is_active', false);
    }

    public function test_customer_cannot_update_other_user_provider(): void
    {
        $user = $this->makeCustomer();
        $other = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $other->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->putJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}", [
                'sender_name' => 'Hacked',
            ]);

        $response->assertNotFound();
    }

    public function test_customer_can_delete_own_provider(): void
    {
        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->deleteJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('wgt_otp_provider_configs', ['id' => $config->id], 'pgsql_runtime');
    }

    public function test_customer_cannot_delete_other_user_provider(): void
    {
        $user = $this->makeCustomer();
        $other = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $other->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->deleteJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}");

        $response->assertNotFound();
    }

    public function test_customer_can_send_test_sms(): void
    {
        Http::fake([
            'api.turbosms.ua/*' => Http::response([
                'response_code' => 0,
                'response_status' => 'OK',
                'response_result' => [['message_id' => 'msg-test']],
            ], 200),
        ]);

        $user = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $user->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->postJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}/test", [
                'phone' => '+380501234567',
            ]);

        $response->assertOk()
            ->assertJson(['sent' => true]);
    }

    public function test_customer_cannot_test_other_user_provider(): void
    {
        $user = $this->makeCustomer();
        $other = $this->makeCustomer();
        $site = Site::factory()->create(['user_id' => $other->id]);
        $config = OtpProviderConfig::factory()->for($site)->create();

        $response = $this->actingAs($user, 'core')
            ->postJson("/api/v1/profile/widgets/sms-otp/providers/{$config->id}/test", [
                'phone' => '+380501234567',
            ]);

        $response->assertNotFound();
    }
}
