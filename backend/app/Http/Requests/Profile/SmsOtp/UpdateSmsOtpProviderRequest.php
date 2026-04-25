<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile\SmsOtp;

use App\Services\Widget\SmsOtp\Provider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSmsOtpProviderRequest extends FormRequest
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

        // Make credentials rules optional for updates
        $optionalCredentialsRules = [];
        foreach ($credentialsRules as $key => $rules) {
            $optionalCredentialsRules[$key] = array_map(
                fn ($r) => $r === 'required' ? 'sometimes' : $r,
                (array) $rules,
            );
        }

        return array_merge([
            'provider' => ['sometimes', 'string', Rule::enum(Provider::class)],
            'credentials' => ['sometimes', 'array'],
            'sender_name' => ['sometimes', 'string', 'max:30'],
            'templates' => ['sometimes', 'array'],
            'templates.uk' => ['sometimes', 'string', 'max:160'],
            'templates.en' => ['sometimes', 'string', 'max:160'],
            'templates.ru' => ['sometimes', 'string', 'max:160'],
            'templates.pl' => ['sometimes', 'string', 'max:160'],
            'is_active' => ['sometimes', 'boolean'],
            'priority' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ], $optionalCredentialsRules);
    }
}
