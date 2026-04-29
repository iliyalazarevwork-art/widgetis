<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Horoshop;

use App\WidgetRuntime\Services\Catalog\Exceptions\XlsxReadException;
use OpenSpout\Reader\XLSX\Reader;

/**
 * Reads only (sku, alias) pairs from an XLSX export — the bare minimum
 * needed to crawl product pages. Header lookup is case-insensitive and
 * supports common variations (artikul/article/sku, alias/slug/url).
 */
final readonly class XlsxAliasSkuReader
{
    private const SKU_HEADERS = ['артикул', 'артикул товару', 'article', 'sku'];
    private const ALIAS_HEADERS = ['алиас', 'аліас', 'alias', 'slug', 'url'];

    public function __construct(private string $path)
    {
    }

    /**
     * @return iterable<AliasSkuRow>
     */
    public function read(): iterable
    {
        if (! is_readable($this->path)) {
            throw new XlsxReadException("XLSX file is not readable: {$this->path}");
        }

        $reader = new Reader();
        $reader->open($this->path);

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                $skuCol = null;
                $aliasCol = null;
                $isFirst = true;

                foreach ($sheet->getRowIterator() as $row) {
                    $cells = $row->toArray();

                    if ($isFirst) {
                        $isFirst = false;
                        [$skuCol, $aliasCol] = $this->resolveHeaderColumns($cells);
                        if ($skuCol === null || $aliasCol === null) {
                            throw new XlsxReadException(
                                'XLSX must contain SKU and alias columns. '
                                .'Recognised SKU headers: '.implode(', ', self::SKU_HEADERS).'. '
                                .'Recognised alias headers: '.implode(', ', self::ALIAS_HEADERS).'.'
                            );
                        }

                        continue;
                    }

                    $sku = trim((string) ($cells[$skuCol] ?? ''));
                    $alias = trim((string) ($cells[$aliasCol] ?? ''));

                    if ($sku === '' || $alias === '') {
                        continue;
                    }

                    yield new AliasSkuRow($sku, $alias);
                }

                break; // first sheet only
            }
        } finally {
            $reader->close();
        }
    }

    /**
     * @param array<int, mixed> $headerCells
     * @return array{0: int|null, 1: int|null}
     */
    private function resolveHeaderColumns(array $headerCells): array
    {
        $normalized = array_map(
            static fn (mixed $h): string => mb_strtolower(trim((string) $h)),
            $headerCells,
        );

        return [
            $this->findColumn($normalized, self::SKU_HEADERS),
            $this->findColumn($normalized, self::ALIAS_HEADERS),
        ];
    }

    /**
     * @param array<int, string> $headers
     * @param list<string>       $candidates
     */
    private function findColumn(array $headers, array $candidates): ?int
    {
        foreach ($candidates as $candidate) {
            $idx = array_search($candidate, $headers, true);
            if ($idx !== false) {
                return (int) $idx;
            }
        }

        return null;
    }
}
