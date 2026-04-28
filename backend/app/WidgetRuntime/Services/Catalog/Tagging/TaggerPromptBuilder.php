<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Tagging;

use App\WidgetRuntime\Models\CatalogProduct;

final readonly class TaggerPromptBuilder
{
    public function __construct(private VerticalDictionary $vertical)
    {
    }

    /**
     * Long, stable system message — prompt-cache-friendly.
     * Describes the taxonomist role and embeds the closed dictionary.
     */
    public function systemMessage(): string
    {
        $lines   = [];
        $lines[] = 'You are a product taxonomist for an e-commerce recommendation engine.';
        $lines[] = 'Your task is to classify each product into a closed taxonomy.';
        $lines[] = 'Always return JSON conforming to the provided schema.';
        $lines[] = 'Never invent enum values not listed in the schema.';
        $lines[] = 'Use snake_case and English only.';
        $lines[] = '';
        $lines[] = 'Taxonomy: ' . $this->vertical->name;
        $lines[] = '';
        $lines[] = 'Fields:';

        foreach ($this->vertical->fields as $fieldName => $fieldDef) {
            /** @var array{type: string, enum?: list<string>, description?: string, min?: int, max?: int} $fieldDef */
            $type = $fieldDef['type'];
            $desc = $fieldDef['description'] ?? '';

            if ($type === 'array') {
                $min = $fieldDef['min'] ?? 1;
                $max = $fieldDef['max'] ?? null;
                $range = $max !== null ? "{$min}–{$max} items" : "min {$min} items";

                if (isset($fieldDef['enum'])) {
                    $opts = implode(', ', $fieldDef['enum']);
                    $lines[] = "  {$fieldName} (array[{$range}], one of: {$opts}): {$desc}";
                } else {
                    $lines[] = "  {$fieldName} (array[{$range}], free strings): {$desc}";
                }
            } else {
                if (isset($fieldDef['enum'])) {
                    $opts = implode(', ', $fieldDef['enum']);
                    $lines[] = "  {$fieldName} (one of: {$opts}): {$desc}";
                } else {
                    $lines[] = "  {$fieldName} (string, free): {$desc}";
                }
            }
        }

        return implode("\n", $lines);
    }

    /**
     * Concise user message describing a single product.
     * Kept under ~1 500 chars to minimise token cost.
     */
    public function userMessage(CatalogProduct $product): string
    {
        $title = $product->title_ua ?? $product->title_en ?? 'Unknown product';

        $parts = [];
        $parts[] = "Title: {$title}";

        if ($product->category_path !== null && $product->category_path !== '') {
            $parts[] = "Category: {$product->category_path}";
        }

        if ($product->brand !== null && $product->brand !== '') {
            $parts[] = "Brand: {$product->brand}";
        }

        /** @var array<string, mixed>|null $attrs */
        $attrs = $product->raw_attributes;

        if (! empty($attrs)) {
            $attrLines = [];

            foreach ($attrs as $key => $value) {
                if (is_array($value)) {
                    $value = implode(', ', array_map('strval', $value));
                }

                $attrLines[] = "{$key}: {$value}";

                if (mb_strlen(implode("\n", $attrLines)) > 600) {
                    break;
                }
            }

            $parts[] = 'Attributes:';
            $parts[] = implode("\n", $attrLines);
        }

        $shortDesc = $product->short_description_ua ?? $product->short_description_en ?? null;

        if ($shortDesc !== null && $shortDesc !== '') {
            $clipped = mb_substr(strip_tags($shortDesc), 0, 400);
            $parts[] = "Description: {$clipped}";
        }

        $message = implode("\n", $parts);

        // Hard cap to ~1 500 chars
        return mb_substr($message, 0, 1500);
    }
}
