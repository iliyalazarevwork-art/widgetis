<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\CartRecommender\Composer;

use App\WidgetRuntime\Models\CartRecommenderRelation;
use App\WidgetRuntime\Models\CatalogProduct;
use App\WidgetRuntime\Services\Widget\CartRecommender\Exceptions\ComposerException;

interface ComposerInterface
{
    /**
     * Compose top-N relations for a single source product.
     * Persists them in wgt_cart_recommender_relations and returns them.
     *
     * @return list<CartRecommenderRelation>
     *
     * @throws ComposerException
     */
    public function composeFor(CatalogProduct $source): array;
}
