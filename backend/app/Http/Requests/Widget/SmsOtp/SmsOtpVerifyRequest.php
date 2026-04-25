<?php

declare(strict_types=1);

namespace App\Http\Requests\Widget\SmsOtp;

use Illuminate\Foundation\Http\FormRequest;

final class SmsOtpVerifyRequest extends FormRequest
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
            'requestId' => ['required', 'string', 'uuid'],
            'code' => ['required', 'string', 'digits:6'],
        ];
    }
}
