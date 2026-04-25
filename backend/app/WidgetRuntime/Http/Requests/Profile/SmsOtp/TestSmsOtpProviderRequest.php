<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Profile\SmsOtp;

use Illuminate\Foundation\Http\FormRequest;

final class TestSmsOtpProviderRequest extends FormRequest
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
        return [
            'phone' => ['required', 'string', 'min:7', 'max:20'],
        ];
    }
}
