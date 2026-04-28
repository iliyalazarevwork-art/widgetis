<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Requests\Widget\CartRecommender;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates query parameters for the cart-recommender suggest endpoint.
 *
 * Accepts any combination of:
 *   - `alias`      (string) — Horoshop product alias (URL slug); looked up in
 *                             wgt_catalog_products.alias after normalisation
 *                             (trimmed, lowercased, leading/trailing slashes stripped).
 *   - `sku`        (string) — Horoshop SKU; looked up in wgt_catalog_products.sku
 *   - `product_id` (int)   — internal wgt_catalog_products.id (Phase 1 compatibility)
 *
 * Resolution priority: alias > sku > product_id.
 * At least one must be present for a useful response, but the controller
 * returns an empty data array rather than a 422 when none resolves.
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
            'alias'      => ['nullable', 'string', 'max:255'],
            'sku'        => ['nullable', 'string', 'max:128'],
            'product_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
