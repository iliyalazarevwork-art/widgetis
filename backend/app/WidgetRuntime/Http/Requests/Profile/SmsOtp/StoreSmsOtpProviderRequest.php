<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Profile\SmsOtp;

use App\WidgetRuntime\Services\Widget\SmsOtp\Provider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreSmsOtpProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $providerValue = $this->input('provider');
        $provider = Provider::tryFrom((string) $providerValue);
        $credentialsRules = $provider !== null ? $provider->credentialsRules() : [];

        return array_merge([
            'site_id' => ['required', 'uuid', 'exists:sites,id'],
            'provider' => ['required', 'string', Rule::enum(Provider::class)],
            'credentials' => ['required', 'array'],
            'sender_name' => ['required', 'string', 'max:30'],
            'templates' => ['required', 'array'],
            'templates.uk' => ['sometimes', 'string', 'max:160'],
            'templates.en' => ['sometimes', 'string', 'max:160'],
            'templates.ru' => ['sometimes', 'string', 'max:160'],
            'templates.pl' => ['sometimes', 'string', 'max:160'],
            'is_active' => ['sometimes', 'boolean'],
        ], $credentialsRules);
    }
}
