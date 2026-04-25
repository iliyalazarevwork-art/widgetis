<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\SmsOtp;

use Illuminate\Foundation\Http\FormRequest;

final class WidgetSessionRequest extends FormRequest
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
            'siteKey' => ['required', 'string', 'uuid'],
        ];
    }
}
