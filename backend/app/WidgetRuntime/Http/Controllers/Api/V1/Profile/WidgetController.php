<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Api\V1\BaseController;
use App\Shared\Contracts\SubscriptionGateInterface;
use App\Shared\Contracts\WidgetCatalogInterface;
use App\Shared\ValueObjects\UserId;
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

    public function __construct(
        private readonly WidgetCatalogInterface $widgetCatalog,
        private readonly SubscriptionGateInterface $subscriptionGate,
    ) {
    }

    public function configSchema(string $productSlug): JsonResponse
    {
        if (! $this->widgetCatalog->widgetExistsBySlug($productSlug)) {
            return $this->error('NOT_FOUND', 'Widget not found.', 404);
        }

        $userId = UserId::fromString($this->authedUserId());
        $planSlug = $this->subscriptionGate->activePlanSlugFor($userId);
        $canFullConfig = in_array($planSlug, self::PRO_PLANS, strict: true);

        $schema = $canFullConfig
            ? ($this->widgetCatalog->getConfigSchemaBySlug($productSlug) ?? self::DEFAULT_SCHEMA)
            : self::DEFAULT_SCHEMA;

        return $this->success([
            'data' => [
                'product_slug' => $productSlug,
                'plan' => $planSlug,
                'can_configure' => $canFullConfig,
                'schema' => $schema,
            ],
        ]);
    }
}
