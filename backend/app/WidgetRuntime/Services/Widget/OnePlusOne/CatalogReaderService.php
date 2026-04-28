<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Widget\OnePlusOne;

use App\WidgetRuntime\Exceptions\OnePlusOne\CatalogDownloadException;
use App\WidgetRuntime\Exceptions\OnePlusOne\UnsupportedCatalogFormatException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

final class CatalogReaderService
{
    private const CACHE_TTL_SECONDS = 3600;

    /**
     * Download and parse the merchant catalog from CDN.
     *
     * @return list<array{article: string, name: string, category: string, price: float}>
     */
    public function getCatalog(string $siteId, string $catalogUrl, string $format = 'xlsx'): array
    {
        $cacheKey = "one_plus_one_catalog:{$siteId}";

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($catalogUrl, $format) {
            $content = $this->downloadFile($catalogUrl);

            return match ($format) {
                'xlsx'  => $this->parseXlsx($content),
                'csv'   => $this->parseCsv($content),
                'json'  => $this->parseJson($content),
                default => throw new UnsupportedCatalogFormatException("Unsupported catalog format: {$format}"),
            };
        });
    }

    public function clearCache(string $siteId): void
    {
        Cache::forget("one_plus_one_catalog:{$siteId}");
    }

    /**
     * Build originalArticle → cloneArticle map by suffix matching.
     * E.g. with suffix "-1uah": "123" → "123-1uah".
     *
     * @param  list<array{article: string, name: string, category: string, price: float}>  $catalog
     * @return array{
     *     product_map: array<string, string>,
     *     article_categories: array<string, string>,
     * }
     */
    public function buildProductMap(array $catalog, string $suffix): array
    {
        $byArticle = [];
        foreach ($catalog as $product) {
            $byArticle[$product['article']] = $product;
        }

        $productMap = [];
        $articleCategories = [];

        foreach ($byArticle as $article => $product) {
            $articleCategories[$article] = $product['category'];

            if (! str_ends_with($article, $suffix)) {
                continue;
            }

            $originalArticle = substr($article, 0, -strlen($suffix));
            if (isset($byArticle[$originalArticle])) {
                $productMap[$originalArticle] = $article;
            }
        }

        Log::info('[OnePlusOne] Built product map from catalog', [
            'suffix'         => $suffix,
            'total_products' => count($catalog),
            'pairs_found'    => count($productMap),
        ]);

        return [
            'product_map'        => $productMap,
            'article_categories' => $articleCategories,
        ];
    }

    private function downloadFile(string $url): string
    {
        $response = Http::timeout(30)->get($url);

        if (! $response->successful()) {
            Log::error('[OnePlusOne] Failed to download catalog', [
                'url'    => $url,
                'status' => $response->status(),
            ]);
            throw new CatalogDownloadException("Failed to download catalog from {$url}: HTTP {$response->status()}");
        }

        return $response->body();
    }

    /**
     * @return list<array{article: string, name: string, category: string, price: float}>
     */
    private function parseXlsx(string $content): array
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'catalog_').'.xlsx';
        file_put_contents($tmpFile, $content);

        $reader = new XlsxReader();

        try {
            $reader->open($tmpFile);

            foreach ($reader->getSheetIterator() as $sheet) {
                return $this->extractSheetRows($sheet->getRowIterator());
            }

            return [];
        } finally {
            $reader->close();
            @unlink($tmpFile);
        }
    }

    /**
     * @param  iterable<\OpenSpout\Common\Entity\Row>  $rowIterator
     * @return list<array{article: string, name: string, category: string, price: float}>
     */
    private function extractSheetRows(iterable $rowIterator): array
    {
        $headers = null;
        $articleCol = null;
        $nameCol = null;
        $categoryCol = null;
        $priceCol = null;
        $products = [];

        foreach ($rowIterator as $row) {
            $cells = array_map(static fn ($v) => (string) $v, $row->toArray());

            if ($headers === null) {
                $headers = array_map(static fn ($h) => mb_strtolower(trim($h)), $cells);
                $articleCol  = $this->findColumn($headers, ['артикул', 'article', 'sku']);
                $nameCol     = $this->findColumn($headers, ['название (ua)', 'название (ru)', 'название', 'name']);
                $categoryCol = $this->findColumn($headers, ['раздел', 'category', 'категория']);
                $priceCol    = $this->findColumn($headers, ['цена', 'price']);

                if ($articleCol === null || $categoryCol === null) {
                    Log::warning('[OnePlusOne] Catalog missing required columns', ['headers' => $headers]);

                    return [];
                }

                continue;
            }

            $article = trim($cells[$articleCol] ?? '');
            if ($article === '') {
                continue;
            }

            $products[] = [
                'article'  => $article,
                'name'     => trim($cells[$nameCol] ?? ''),
                'category' => trim($cells[$categoryCol] ?? ''),
                'price'    => (float) ($cells[$priceCol] ?? 0),
            ];
        }

        return $products;
    }

    /**
     * @return list<array{article: string, name: string, category: string, price: float}>
     */
    private function parseCsv(string $content): array
    {
        $lines = preg_split("/\r\n|\n|\r/", $content) ?: [];
        if (count($lines) < 2) {
            return [];
        }

        $headers = array_map(static fn ($h) => mb_strtolower(trim($h)), str_getcsv($lines[0]));

        $articleCol  = $this->findColumn($headers, ['артикул', 'article', 'sku']);
        $nameCol     = $this->findColumn($headers, ['название', 'name', 'название (ua)']);
        $categoryCol = $this->findColumn($headers, ['раздел', 'category', 'категория']);
        $priceCol    = $this->findColumn($headers, ['цена', 'price']);

        if ($articleCol === null || $categoryCol === null) {
            return [];
        }

        $products = [];
        for ($i = 1, $count = count($lines); $i < $count; $i++) {
            if ($lines[$i] === '') {
                continue;
            }
            $row = str_getcsv($lines[$i]);
            $article = trim((string) ($row[$articleCol] ?? ''));
            if ($article === '') {
                continue;
            }

            $products[] = [
                'article'  => $article,
                'name'     => trim((string) ($row[$nameCol] ?? '')),
                'category' => trim((string) ($row[$categoryCol] ?? '')),
                'price'    => (float) ($row[$priceCol] ?? 0),
            ];
        }

        return $products;
    }

    /**
     * @return list<array{article: string, name: string, category: string, price: float}>
     */
    private function parseJson(string $content): array
    {
        $data = json_decode($content, true);
        if (! is_array($data)) {
            return [];
        }

        $products = [];
        foreach ($data as $item) {
            if (! is_array($item)) {
                continue;
            }
            $article = trim((string) ($item['article'] ?? $item['sku'] ?? ''));
            if ($article === '') {
                continue;
            }

            $products[] = [
                'article'  => $article,
                'name'     => trim((string) ($item['name'] ?? '')),
                'category' => trim((string) ($item['category'] ?? '')),
                'price'    => (float) ($item['price'] ?? 0),
            ];
        }

        return $products;
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string>  $possibleNames
     */
    private function findColumn(array $headers, array $possibleNames): ?int
    {
        foreach ($possibleNames as $name) {
            $index = array_search(mb_strtolower($name), $headers, true);
            if ($index !== false) {
                return (int) $index;
            }
        }

        return null;
    }
}
