<?php

declare(strict_types=1);

namespace App\Core\Http\Resources\Api\V1;

use App\Core\Models\Plan;
use App\Core\Models\PlanFeatureValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Plan */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $featureValues = PlanFeatureValue::with('feature')
            ->where('plan_id', $this->id)
            ->get()
            ->sortBy(fn (PlanFeatureValue $v) => $v->feature->sort_order);

        $locale = app()->getLocale();

        $featureList = $featureValues->map(function (PlanFeatureValue $v) use ($locale) {
            $val = $v->value;
            $name = $v->feature->name;

            return [
                'key' => $v->feature->feature_key,
                'name' => is_array($name) ? ($name[$locale] ?? $name['uk'] ?? '') : $name,
                'value' => $this->resolveValue($val, $locale),
                'category' => $v->feature->category,
            ];
        })->values()->all();

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'price_monthly' => (float) $this->price_monthly,
            'price_yearly' => (float) $this->price_yearly,
            'trial_days' => (int) $this->trial_days,
            'max_sites' => $this->max_sites,
            'max_widgets' => $this->max_widgets,
            'features' => $this->features,
            'languages_supported' => $this->languages_supported,
            'widget_limits_config' => $this->widget_limits_config,
            'feature_list' => $featureList,
            'is_recommended' => $this->is_recommended,
            'widget_slugs' => $this->whenLoaded('products', fn () => $this->products->pluck('slug')->all()),
        ];
    }

    private function resolveValue(mixed $val, string $locale): mixed
    {
        if (is_bool($val)) {
            return $val;
        }
        if (is_array($val) && (isset($val['uk']) || isset($val['en']))) {
            return $val[$locale] ?? $val['uk'] ?? '';
        }

        return $val;
    }
}
