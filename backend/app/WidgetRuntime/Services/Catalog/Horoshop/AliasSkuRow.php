<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Horoshop;

final readonly class AliasSkuRow
{
    public function __construct(
        public string $sku,
        public string $alias,
    ) {
    }
}
