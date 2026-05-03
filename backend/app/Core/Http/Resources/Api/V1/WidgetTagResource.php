<?php

declare(strict_types=1);

namespace App\Core\Http\Resources\Api\V1;

use App\Core\Models\WidgetTag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin WidgetTag */
class WidgetTagResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'slug'  => $this->slug,
            'name'  => $this->translated('name'),
            'color' => $this->color,
            'count' => (int) ($this->products_count ?? 0),
        ];
    }
}
