<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Admin\OnePlusOne;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePromoRequest extends FormRequest
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
            'name'                => ['sometimes', 'string', 'max:100'],
            'is_active'           => ['sometimes', 'boolean'],
            'catalog_url'         => ['sometimes', 'string', 'max:500', 'url'],
            'catalog_format'      => ['sometimes', Rule::in(['xlsx', 'csv', 'json'])],
            'categories'          => ['nullable', 'array'],
            'categories.*'        => ['string'],
            'product_map'         => ['nullable', 'array'],
            'article_categories'  => ['nullable', 'array'],
            'article_suffix'      => ['sometimes', 'string', 'max:20'],
            'min_items'           => ['sometimes', 'integer', 'min:2'],
            'one_uah_price'       => ['sometimes', 'numeric', 'min:0'],
            'settings'            => ['nullable', 'array'],
        ];
    }
}
