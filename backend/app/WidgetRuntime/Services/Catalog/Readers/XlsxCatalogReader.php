<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Readers;

use App\WidgetRuntime\Services\Catalog\DTO\RawProduct;
use App\WidgetRuntime\Services\Catalog\Exceptions\XlsxReadException;
use OpenSpout\Reader\XLSX\Reader;

final readonly class XlsxCatalogReader implements CatalogReader
{
    public function __construct(private string $path)
    {
    }

    /**
     * @return iterable<RawProduct>
     */
    public function read(): iterable
    {
        if (! is_readable($this->path)) {
            throw new XlsxReadException("XLSX file is not readable: {$this->path}");
        }

        $reader = new Reader();

        try {
            $reader->open($this->path);

            foreach ($reader->getSheetIterator() as $sheet) {
                $skipFirst = true;

                foreach ($sheet->getRowIterator() as $row) {
                    if ($skipFirst) {
                        $skipFirst = false;
                        continue;
                    }

                    $cells = $row->toArray();

                    $dto = RawProduct::fromXlsxRow($cells);

                    if ($dto !== null) {
                        yield $dto;
                    }
                }

                break; // only first sheet
            }
        } finally {
            $reader->close();
        }
    }
}
