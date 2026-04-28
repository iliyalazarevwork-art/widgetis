<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\CartRecommender;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates query parameters for the cart-recommender suggest endpoint.
 *
 * Accepts either:
 *   - `sku`        (string) — Horoshop SKU; looked up in wgt_catalog_products.sku
 *   - `product_id` (int)   — internal wgt_catalog_products.id (Phase 1 compatibility)
 *
 * When both are supplied, `sku` takes precedence.
 * At least one must be present for a useful response, but the controller
 * returns an empty data array rather than a 422 when neither resolves.
 */
final class SuggestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'sku'        => ['nullable', 'string', 'max:128'],
            'product_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
