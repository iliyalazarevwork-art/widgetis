<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Public;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:plan,widget'],
            'target_id' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^\+?[0-9\s\-()]{10,20}$/'],
        ];
    }
}
