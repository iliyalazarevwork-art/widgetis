<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Enums;

enum CartRecommenderRelationSource: string
{
    case LazyAi = 'lazy_ai';
    case RuleFallback = 'rule_fallback';
    case CategoryFallback = 'category_fallback';
}
