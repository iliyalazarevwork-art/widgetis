<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'plan_slug'      => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
            'provider'       => ['required', 'string', 'in:monobank,wayforpay'],
            'site_domain'    => ['required', 'string', 'max:255'],
            'platform'       => ['nullable', 'string', 'max:100'],
            'redirect_url'   => ['nullable', 'string', 'max:500'],
        ];
    }
}
