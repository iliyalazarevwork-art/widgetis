<?php

declare(strict_types=1);

namespace App\Core\Http\Resources\Api\V1;

use App\Core\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'icon' => $this->icon,
            'tag' => $this->whenLoaded('tag', fn () => new WidgetTagResource($this->tag)),
            'platform' => $this->platform,
            'is_popular' => $this->is_popular,
            'is_new' => $this->is_new,
        ];
    }
}
