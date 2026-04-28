<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Admin\OnePlusOne;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StorePromoRequest extends FormRequest
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
            'site_id'             => [
                'required',
                'uuid',
                Rule::exists('pgsql_runtime.wgt_sites', 'id'),
                Rule::unique('pgsql_runtime.wgt_one_plus_one_promos', 'site_id'),
            ],
            'name'                => ['required', 'string', 'max:100'],
            'is_active'           => ['boolean'],
            'catalog_url'         => ['required', 'string', 'max:500', 'url'],
            'catalog_format'      => ['required', Rule::in(['xlsx', 'csv', 'json'])],
            'categories'          => ['nullable', 'array'],
            'categories.*'        => ['string'],
            'product_map'         => ['nullable', 'array'],
            'article_categories'  => ['nullable', 'array'],
            'article_suffix'      => ['nullable', 'string', 'max:20'],
            'min_items'           => ['nullable', 'integer', 'min:2'],
            'one_uah_price'       => ['nullable', 'numeric', 'min:0'],
            'settings'            => ['nullable', 'array'],
        ];
    }
}
