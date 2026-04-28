<?php

declare(strict_types=1);

/*
 * Generic vertical — fallback when nothing more specific applies. Captures the
 * minimum signal the composer needs to assemble cohesive recommendations:
 * primary type, dominant style, dominant color family, role in a "complete the
 * look", and a list of complementary primary types.
 */

return [
    'name' => 'generic',

    'fields' => [
        'primary_type' => [
            'type'        => 'string',
            'description' => 'Most specific noun describing the product (e.g. "running_shoes", "ceramic_mug"). snake_case, English.',
        ],
        'style' => [
            'type'        => 'array',
            'enum'        => ['minimalist', 'classic', 'modern', 'rustic', 'sport', 'luxury', 'casual', 'romantic', 'industrial', 'boho'],
            'description' => 'One to three style tags from the closed list.',
            'min'         => 1,
            'max'         => 3,
        ],
        'color_family' => [
            'type'        => 'string',
            'enum'        => ['neutral', 'white', 'black', 'gray', 'beige', 'pastel_pink', 'pastel_blue', 'green', 'blue', 'red', 'yellow', 'brown', 'multicolor'],
            'description' => 'Dominant color family of the product.',
        ],
        'role' => [
            'type'        => 'string',
            'enum'        => ['hero', 'accent', 'accessory'],
            'description' => 'Hero = main item, Accent = goes around the hero, Accessory = small completing item.',
        ],
        'complements' => [
            'type'        => 'array',
            'description' => 'snake_case primary_type values that pair well with this product. 1–6 items.',
            'min'         => 0,
            'max'         => 6,
        ],
    ],
];
