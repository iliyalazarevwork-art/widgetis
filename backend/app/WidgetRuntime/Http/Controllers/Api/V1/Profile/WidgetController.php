<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class WidgetController extends BaseController
{
    private const DEFAULT_SCHEMA = [
        'enabled' => [
            'type' => 'boolean',
            'default' => true,
            'label' => ['en' => 'Enabled', 'uk' => 'Увімкнено'],
        ],
    ];

    private const PRO_PLANS = ['pro', 'max'];

    public function configSchema(string $productSlug): JsonResponse
    {
        $product = Product::where('slug', $productSlug)->active()->firstOrFail();

        $user = $this->currentUser();
        $plan = $user->currentPlan();
        $planSlug = $plan?->slug;

        $canFullConfig = in_array($planSlug, self::PRO_PLANS, strict: true);

        $schema = $canFullConfig
            ? ($product->config_schema ?? self::DEFAULT_SCHEMA)
            : self::DEFAULT_SCHEMA;

        return $this->success([
            'data' => [
                'product_slug' => $product->slug,
                'plan' => $planSlug,
                'can_configure' => $canFullConfig,
                'schema' => $schema,
            ],
        ]);
    }
}
