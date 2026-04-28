<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Enums;

enum CartRecommenderEventType: string
{
    case Impression = 'impression';
    case Click = 'click';
    case AddToCart = 'add_to_cart';
}
