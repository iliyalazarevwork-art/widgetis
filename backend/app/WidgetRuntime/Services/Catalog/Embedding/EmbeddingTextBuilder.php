<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Embedding;

use App\WidgetRuntime\Models\CatalogProduct;

/**
 * Builds a compact plain-text representation of a product for embedding.
 *
 * Format: "<title> | <category_path> | <style> | <material> | <color_family> | <mood> | <attrs>"
 * Total result is clipped to 500 characters to stay well inside the token budget.
 */
final readonly class EmbeddingTextBuilder
{
    private const MAX_LENGTH = 500;

    private const SEPARATOR = ' | ';

    public function build(CatalogProduct $product): string
    {
        $parts = [];

        $title = $product->title_ua ?? $product->title_en ?? '';
        if ($title !== '') {
            $parts[] = $title;
        }

        $categoryPath = $product->category_path ?? '';
        if ($categoryPath !== '') {
            $parts[] = $categoryPath;
        }

        /** @var array<string, mixed>|null $tags */
        $tags = $product->ai_tags;

        if (is_array($tags)) {
            $style = $tags['style'] ?? null;
            if (is_array($style) && count($style) > 0) {
                $parts[] = implode(', ', $style);
            }

            $material = $tags['material'] ?? null;
            if (is_string($material) && $material !== '') {
                $parts[] = $material;
            }

            $colorFamily = $tags['color_family'] ?? null;
            if (is_string($colorFamily) && $colorFamily !== '') {
                $parts[] = $colorFamily;
            }

            $mood = $tags['mood'] ?? null;
            if (is_string($mood) && $mood !== '') {
                $parts[] = $mood;
            }
        }

        /** @var array<int|string, mixed>|null $rawAttrs */
        $rawAttrs = $product->raw_attributes;
        if (is_array($rawAttrs)) {
            $attrValues = [];
            foreach (array_slice($rawAttrs, 0, 3) as $attr) {
                if (is_array($attr)) {
                    $val = $attr['value'] ?? $attr[1] ?? null;
                } else {
                    $val = $attr;
                }
                if (is_string($val) && $val !== '') {
                    $attrValues[] = $val;
                }
            }
            if (count($attrValues) > 0) {
                $parts[] = implode(', ', $attrValues);
            }
        }

        $text = implode(self::SEPARATOR, $parts);

        if (mb_strlen($text) > self::MAX_LENGTH) {
            $text = mb_substr($text, 0, self::MAX_LENGTH);
        }

        return $text;
    }
}
