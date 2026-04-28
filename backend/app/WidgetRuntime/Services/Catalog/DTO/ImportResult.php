<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\DTO;

final readonly class ImportResult
{
    public function __construct(
        public int $inserted,
        public int $updated,
        public int $unchanged,
        public int $skippedVariants,
        public int $skippedHidden,
    ) {
    }
}
