<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\WidgetRuntime\Http\Requests\Profile\SmsOtp\StoreSmsOtpProviderRequest;
use App\WidgetRuntime\Http\Requests\Profile\SmsOtp\TestSmsOtpProviderRequest;
use App\WidgetRuntime\Http\Requests\Profile\SmsOtp\UpdateSmsOtpProviderRequest;
use App\WidgetRuntime\Models\OtpProviderConfig;
use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Widget\SmsOtp\Channel;
use App\WidgetRuntime\Services\Widget\SmsOtp\Data\SendOtpCommand;
use App\WidgetRuntime\Services\Widget\SmsOtp\Exceptions\OtpProviderException;
use App\WidgetRuntime\Services\Widget\SmsOtp\OtpProviderRegistry;
use App\WidgetRuntime\Services\Widget\SmsOtp\PhoneNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SmsOtpProviderController extends BaseController
{
    public function __construct(
        private readonly OtpProviderRegistry $registry,
        private readonly PhoneNormalizer $normalizer,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $siteId = $request->string('site_id')->toString();
        $site = $this->findOwnedSite($siteId);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        $configs = OtpProviderConfig::where('site_id', $site->id)
            ->orderByDesc('priority')
            ->get()
            ->map(fn (OtpProviderConfig $c) => $this->formatConfig($c));

        return $this->success($configs);
    }

    public function store(StoreSmsOtpProviderRequest $request): JsonResponse
    {
        $siteId = $request->string('site_id')->toString();
        $site = $this->findOwnedSite($siteId);

        if ($site === null) {
            return $this->error('NOT_FOUND', 'Site not found.', 404);
        }

        /** @var array<string, mixed> $validated */
        $validated = $request->validated();

        $config = OtpProviderConfig::create([
            'site_id' => $site->id,
            'provider' => $validated['provider'],
            'channel' => Channel::Sms->value,
            'credentials' => $validated['credentials'],
            'sender_name' => $validated['sender_name'],
            'templates' => $validated['templates'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->created($this->formatConfig($config));
    }

    public function update(UpdateSmsOtpProviderRequest $request, string $configId): JsonResponse
    {
        $config = $this->findOwnedConfig($configId);

        if ($config === null) {
            return $this->error('NOT_FOUND', 'Provider config not found.', 404);
        }

        /** @var array<string, mixed> $validated */
        $validated = $request->validated();

        $config->update($validated);

        return $this->success($this->formatConfig($config->fresh() ?? $config));
    }

    public function destroy(string $configId): JsonResponse
    {
        $config = $this->findOwnedConfig($configId);

        if ($config === null) {
            return $this->error('NOT_FOUND', 'Provider config not found.', 404);
        }

        $config->delete();

        return $this->noContent();
    }

    public function test(TestSmsOtpProviderRequest $request, string $configId): JsonResponse
    {
        $config = $this->findOwnedConfig($configId);

        if ($config === null) {
            return $this->error('NOT_FOUND', 'Provider config not found.', 404);
        }

        $rawPhone = $request->string('phone')->toString();

        try {
            $phone = $this->normalizer->normalize($rawPhone);
        } catch (\InvalidArgumentException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }

        /** @var array<string, string> $templates */
        $templates = (array) $config->templates;
        $text = $templates['uk'] ?? $templates['en'] ?? (count($templates) > 0 ? (string) reset($templates) : 'Test code: 123456');
        $text = str_replace('{code}', '123456', $text);

        $command = SendOtpCommand::make(
            phone: $phone,
            code: '123456',
            senderName: $config->sender_name,
            text: $text,
            channel: Channel::Sms,
            locale: 'uk',
        );

        try {
            /** @var array<string, mixed> $credentials */
            $credentials = $config->credentials;
            $this->registry
                ->resolve($config->provider, $credentials)
                ->send($command);
        } catch (OtpProviderException $e) {
            return $this->error('PROVIDER_ERROR', $e->getMessage(), 503);
        }

        return $this->success(['sent' => true]);
    }

    private function findOwnedSite(string $siteId): ?Site
    {
        if ($siteId === '') {
            return null;
        }

        return Site::where('id', $siteId)
            ->where('user_id', $this->currentUser()->id)
            ->first();
    }

    private function findOwnedConfig(string $configId): ?OtpProviderConfig
    {
        $config = OtpProviderConfig::find($configId);

        if ($config === null) {
            return null;
        }

        $site = Site::where('id', $config->site_id)
            ->where('user_id', $this->currentUser()->id)
            ->first();

        if ($site === null) {
            return null;
        }

        return $config;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatConfig(OtpProviderConfig $config): array
    {
        return [
            'id' => $config->id,
            'site_id' => $config->site_id,
            'provider' => $config->provider->value,
            'channel' => $config->channel->value,
            'sender_name' => $config->sender_name,
            'templates' => $config->templates,
            'is_active' => $config->is_active,
            'priority' => $config->priority,
            'created_at' => $config->created_at?->toIso8601String(),
            'updated_at' => $config->updated_at?->toIso8601String(),
        ];
    }
}
