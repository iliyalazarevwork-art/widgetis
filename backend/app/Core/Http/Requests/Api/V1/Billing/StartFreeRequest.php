<?php

declare(strict_types=1);

namespace App\Core\Http\Requests\Api\V1\Billing;

use Illuminate\Foundation\Http\FormRequest;

final class StartFreeRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'site_domain' => ['required', 'string', 'max:255'],
            'platform'    => ['nullable', 'string', 'max:100'],
        ];
    }
}
