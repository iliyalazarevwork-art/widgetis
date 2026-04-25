<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\SmsOtp;

use Illuminate\Foundation\Http\FormRequest;

final class SmsOtpRequestRequest extends FormRequest
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
            'locale' => ['sometimes', 'string', 'in:uk,en,ru,pl'],
            'utm_source' => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }
}
