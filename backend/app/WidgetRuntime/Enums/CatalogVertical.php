<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Enums;

enum CatalogVertical: string
{
    case Bedding = 'bedding';
    case Generic = 'generic';

    public static function default(): self
    {
        return self::Generic;
    }
}
