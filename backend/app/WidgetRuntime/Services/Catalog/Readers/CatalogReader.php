<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Readers;

use App\WidgetRuntime\Services\Catalog\DTO\RawProduct;

interface CatalogReader
{
    /**
     * @return iterable<RawProduct>
     */
    public function read(): iterable;
}
