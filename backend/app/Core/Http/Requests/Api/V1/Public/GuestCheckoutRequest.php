<?php

declare(strict_types=1);

namespace App\Core\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class GuestCheckoutRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email'          => ['required', 'email', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'site_domain'    => ['required', 'string', 'max:255'],
            'platform'       => ['nullable', 'string', 'max:100'],
            'plan_slug'      => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
            'provider'       => ['required', 'string', 'in:monobank,wayforpay'],
        ];
    }
}
