<?php

declare(strict_types=1);

namespace App\SmartSearch\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SearchProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>|string>
     */
    public function rules(): array
    {
        return [
            'q'        => ['required', 'string', 'min:2', 'max:90'],
            'limit'    => ['sometimes', 'integer', 'min:1', 'max:100'],
            'category' => ['sometimes', 'nullable', 'string', 'max:200'],
        ];
    }
}
