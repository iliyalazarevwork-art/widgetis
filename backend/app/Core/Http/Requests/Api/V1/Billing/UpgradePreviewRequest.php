<?php

declare(strict_types=1);

namespace App\Core\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;

class UpgradePreviewRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'plan_slug'      => ['required', 'string', 'exists:plans,slug'],
            'billing_period' => ['required', 'string', 'in:monthly,yearly'],
        ];
    }
}
