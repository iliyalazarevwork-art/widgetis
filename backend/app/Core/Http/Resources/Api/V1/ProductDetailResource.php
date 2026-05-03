<?php

declare(strict_types=1);

namespace App\Core\Http\Resources\Api\V1;

use App\Core\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Product */
class ProductDetailResource extends JsonResource
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
            'long_description' => $this->translated('long_description'),
            'features' => $this->features,
            'icon' => $this->icon,
            'tag' => $this->whenLoaded('tag', fn () => new WidgetTagResource($this->tag)),
            'platform' => $this->platform,
            'is_popular' => $this->is_popular,
            'is_new' => $this->is_new,
            'preview_before' => $this->preview_before,
            'preview_after' => $this->preview_after,
            'config_schema' => $this->config_schema,
            'related_slugs' => $this->related_slugs,
        ];
    }
}
