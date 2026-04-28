<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Cartum\DTO;

use App\WidgetRuntime\Models\CatalogProduct;

/**
 * Immutable view of a single product after Cartum live-data enrichment.
 *
 * When `$live` is true the price / stock / image values come from a fresh
 * Cartum API response; when false they are snapshot values from the DB.
 */
final readonly class LiveProductView
{
    public function __construct(
        public int $productId,
        public string $sku,
        public ?string $titleUa,
        public ?string $titleEn,
        /** URL derived from alias, e.g. '/{alias}/', or null when no alias. */
        public ?string $url,
        public ?string $imageUrl,
        public ?float $priceNew,
        public ?float $priceOld,
        public ?string $currency,
        public bool $inStock,
        /** true = enriched from Cartum, false = DB snapshot fallback. */
        public bool $live,
    ) {
    }

    /** Build a view from the DB snapshot only (no live data available). */
    public static function fromSnapshot(CatalogProduct $p): self
    {
        return new self(
            productId: (int) $p->id,
            sku: (string) $p->sku,
            titleUa: $p->title_ua,
            titleEn: $p->title_en,
            url: self::urlFromAlias($p->alias),
            imageUrl: $p->image_url,
            priceNew: $p->price !== null ? (float) $p->price : null,
            priceOld: $p->old_price !== null ? (float) $p->old_price : null,
            currency: $p->currency,
            inStock: (bool) $p->in_stock,
            live: false,
        );
    }

    /**
     * Merge DB snapshot with a Cartum catalog item.
     * Fresh Cartum values override the snapshot where present.
     *
     * @param array<string, mixed> $cartumItem
     */
    public static function fromCartum(CatalogProduct $p, array $cartumItem): self
    {
        return new self(
            productId: (int) $p->id,
            sku: (string) $p->sku,
            titleUa: self::titleFrom($cartumItem, 'ua') ?? $p->title_ua,
            titleEn: self::titleFrom($cartumItem, 'en') ?? $p->title_en,
            url: self::urlFromAlias($p->alias),
            imageUrl: self::imageFrom($cartumItem) ?? $p->image_url,
            priceNew: self::numericFrom($cartumItem, 'price') ?? ($p->price !== null ? (float) $p->price : null),
            priceOld: self::numericFrom($cartumItem, 'oldPrice') ?? ($p->old_price !== null ? (float) $p->old_price : null),
            currency: $p->currency,                    // Cartum does not expose currency
            inStock: self::inStockFrom($cartumItem),
            live: true,
        );
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private static function urlFromAlias(?string $alias): ?string
    {
        if ($alias === null || $alias === '') {
            return null;
        }

        return '/' . ltrim($alias, '/') . '/';
    }

    /**
     * Extract a title string for the requested locale from a Cartum name field.
     *
     * Cartum returns name as either a plain string or a translatable object
     * like {"uk": "...", "ru": "...", "en": "..."}.
     */
    private static function titleFrom(mixed $cartumItem, string $locale): ?string
    {
        if (!is_array($cartumItem)) {
            return null;
        }

        $name = $cartumItem['name'] ?? null;

        if (is_string($name) && $name !== '') {
            // Single-language string — use it for Ukrainian; ignore for EN.
            return $locale === 'ua' ? $name : null;
        }

        if (is_array($name)) {
            // Translatable object: prefer locale, then 'uk' alias for 'ua', then 'ru'.
            $candidates = match ($locale) {
                'ua'    => ['uk', 'ua', 'ru'],
                default => [$locale],
            };

            foreach ($candidates as $key) {
                $val = $name[$key] ?? null;
                if (is_string($val) && $val !== '') {
                    return $val;
                }
            }
        }

        return null;
    }

    /**
     * Extract the first image URL from a Cartum item's images array.
     *
     * @param array<string, mixed> $cartumItem
     */
    private static function imageFrom(array $cartumItem): ?string
    {
        $images = $cartumItem['images'] ?? null;

        if (!is_array($images) || $images === []) {
            return null;
        }

        $first = reset($images);

        return is_string($first) && $first !== '' ? $first : null;
    }

    /**
     * Extract a numeric field from a Cartum item, returning null when absent.
     *
     * @param array<string, mixed> $cartumItem
     */
    private static function numericFrom(array $cartumItem, string $field): ?float
    {
        $val = $cartumItem[$field] ?? null;

        if (is_numeric($val)) {
            return (float) $val;
        }

        return null;
    }

    /**
     * Derive stock availability from Cartum's presence string.
     *
     * Presence values observed in production data:
     *   "В наявності" → in stock
     *   "Немає в наявності" / "Out of stock" / … → not in stock
     *
     * We match on the Cyrillic substring "наявн" (covers all Ukrainian forms)
     * and the Russian cognate "налич".
     *
     * @param array<string, mixed> $cartumItem
     */
    private static function inStockFrom(array $cartumItem): bool
    {
        $presence = $cartumItem['presence'] ?? null;

        if (!is_string($presence)) {
            return false;
        }

        $lower = mb_strtolower($presence);

        return str_contains($lower, 'наявн') || str_contains($lower, 'налич');
    }
}
