<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\DTO;

final readonly class RawProduct
{
    public function __construct(
        public string $sku,
        public ?string $parentSku,
        public ?string $alias,
        public ?string $titleUa,
        public ?string $titleEn,
        public ?string $categoryPath,
        public ?string $brand,
        public ?float $price,
        public ?float $oldPrice,
        public ?string $currency,
        public bool $inStock,
        public ?string $imageUrl,
        /** @var list<string> */
        public array $imageUrls,
        public ?string $descriptionUa,
        public ?string $descriptionEn,
        public ?string $shortDescriptionUa,
        public ?string $shortDescriptionEn,
        /** @var array<string, string> */
        public array $rawAttributes,
    ) {
    }

    /**
     * Returns md5 of canonicalised content.
     */
    public function sourceHash(): string
    {
        $attributes = $this->rawAttributes;
        ksort($attributes);

        $payload = json_encode([
            'sku'                  => $this->sku,
            'parent_sku'           => $this->parentSku,
            'alias'                => $this->alias,
            'title_ua'             => $this->titleUa,
            'title_en'             => $this->titleEn,
            'category_path'        => $this->categoryPath,
            'brand'                => $this->brand,
            'price'                => $this->price,
            'old_price'            => $this->oldPrice,
            'currency'             => $this->currency,
            'in_stock'             => $this->inStock,
            'image_url'            => $this->imageUrl,
            'image_urls'           => $this->imageUrls,
            'description_ua'       => $this->descriptionUa,
            'description_en'       => $this->descriptionEn,
            'short_description_ua' => $this->shortDescriptionUa,
            'short_description_en' => $this->shortDescriptionEn,
            'raw_attributes'       => $attributes,
        ], JSON_THROW_ON_ERROR);

        return md5($payload);
    }

    /**
     * Build a DTO from a raw XLSX row (0-indexed cells array).
     * Returns null if visibility is off or SKU is empty.
     *
     * @param array<int, mixed> $cells
     */
    public static function fromXlsxRow(array $cells): ?self
    {
        $cell = static fn (int $idx): mixed => $cells[$idx] ?? null;
        $str  = static fn (int $idx): ?string => self::nullableString($cell($idx));

        $sku = trim((string) ($cell(0) ?? ''));
        if ($sku === '') {
            return null;
        }

        // Col 14 — visibility. Skip if explicitly "no".
        $visibility = strtolower(trim((string) ($cell(14) ?? '')));
        if (in_array($visibility, ['нет', 'no', 'false', '0'], true)) {
            return null;
        }

        $parentSku = $str(1);
        if ($parentSku === '') {
            $parentSku = null;
        }

        // Price — col 11, old_price — col 12
        $priceRaw    = $cell(11);
        $oldPriceRaw = $cell(12);
        $price       = self::parsePrice($priceRaw);
        $oldPrice    = self::parsePrice($oldPriceRaw);

        // If price is 0 and old_price is also empty, treat price as null
        if ($price !== null && $price === 0.0 && $oldPrice === null) {
            $price = null;
        }

        // Stock — col 15
        $stockStr = strtolower(trim((string) ($cell(15) ?? '')));
        $inStock  = $stockStr !== '' && (
            str_contains($stockStr, 'наявн')
            || str_contains($stockStr, 'наличи')
            || str_contains($stockStr, 'in stock')
        );

        // Images — col 16
        [$imageUrl, $imageUrls] = self::parseImages($cell(16));

        // Descriptions
        $descriptionUa       = self::cleanHtml($str(18), 4000);
        $descriptionEn       = self::cleanHtml($str(19), 4000);
        $shortDescriptionUa  = self::cleanHtml($str(20), 1000);
        $shortDescriptionEn  = self::cleanHtml($str(21), 1000);

        // Raw attributes (cols 22–28)
        $rawAttributes = self::parseRawAttributes($cells);

        return new self(
            sku: $sku,
            parentSku: $parentSku,
            alias: $str(7),
            titleUa: $str(3),
            titleEn: $str(4),
            categoryPath: $str(9),
            brand: $str(8),
            price: $price,
            oldPrice: $oldPrice,
            currency: $str(13),
            inStock: $inStock,
            imageUrl: $imageUrl,
            imageUrls: $imageUrls,
            descriptionUa: $descriptionUa,
            descriptionEn: $descriptionEn,
            shortDescriptionUa: $shortDescriptionUa,
            shortDescriptionEn: $shortDescriptionEn,
            rawAttributes: $rawAttributes,
        );
    }

    public static function cleanHtml(?string $html, int $maxLen): ?string
    {
        if ($html === null || $html === '') {
            return null;
        }

        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = (string) preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        if ($text === '') {
            return null;
        }

        return mb_substr($text, 0, $maxLen);
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $str = trim((string) $value);

        return $str === '' ? null : $str;
    }

    private static function parsePrice(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        $float = (float) str_replace(',', '.', (string) $value);

        return $float === 0.0 ? null : $float;
    }

    /**
     * @return array{?string, list<string>}
     */
    private static function parseImages(mixed $value): array
    {
        if ($value === null || trim((string) $value) === '') {
            return [null, []];
        }

        $raw  = (string) $value;
        $urls = array_filter(
            array_map('trim', preg_split('/[;\n\r]+/', $raw) ?: []),
            fn (string $u): bool => $u !== '',
        );
        $urls = array_values(array_slice($urls, 0, 10));

        /** @var list<string> $urls */
        $first = $urls[0] ?? null;

        return [$first, $urls];
    }

    /**
     * @param array<int, mixed> $cells
     * @return array<string, string>
     */
    private static function parseRawAttributes(array $cells): array
    {
        $map = [
            22 => 'material',
            23 => 'pillowcases',
            24 => 'sheet',
            25 => 'size',
            26 => 'amount',
            27 => 'embroidery',
            28 => 'color',
        ];

        $attrs = [];
        foreach ($map as $col => $key) {
            $val = isset($cells[$col]) ? trim((string) $cells[$col]) : '';
            if ($val !== '') {
                $attrs[$key] = $val;
            }
        }

        return $attrs;
    }
}
