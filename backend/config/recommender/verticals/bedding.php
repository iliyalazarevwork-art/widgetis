<?php

declare(strict_types=1);

/*
 * Bedding vertical — постельное бельё, домашний текстиль для спальни. Тegs
 * tuned for "complete the look" recommendations: a satin set is the hero,
 * matching pillowcases are accents, throw blankets/cushions are accessories.
 */

return [
    'name' => 'bedding',

    'fields' => [
        'primary_type' => [
            'type'        => 'string',
            'enum'        => [
                'bedding_set',
                'duvet_cover',
                'fitted_sheet',
                'flat_sheet',
                'pillowcase',
                'pillow',
                'duvet_insert',
                'blanket',
                'throw_blanket',
                'bedspread',
                'mattress_topper',
                'mattress_protector',
                'cushion',
                'cushion_cover',
                'sleeping_bag',
                'bathrobe',
                'towel',
                'bath_set',
                'curtain',
                'home_decor',
                'other',
            ],
            'description' => 'Most specific bedding category.',
        ],
        'style' => [
            'type'        => 'array',
            'enum'        => ['minimalist', 'romantic', 'classic', 'boho', 'scandinavian', 'modern', 'rustic', 'luxury', 'kids', 'seasonal'],
            'description' => 'One to three style tags from the closed list.',
            'min'         => 1,
            'max'         => 3,
        ],
        'color_family' => [
            'type'        => 'string',
            'enum'        => ['white', 'cream', 'beige', 'gray', 'black', 'pastel_pink', 'pastel_blue', 'pastel_green', 'sage', 'dusty_pink', 'navy', 'brown', 'mustard', 'terracotta', 'multicolor', 'neutral'],
            'description' => 'Dominant color family of the product.',
        ],
        'palette' => [
            'type'        => 'array',
            'description' => 'Up to three color_family values describing the full palette. Always includes color_family as the first element.',
            'min'         => 1,
            'max'         => 3,
        ],
        'material' => [
            'type'        => 'string',
            'enum'        => ['cotton', 'satin', 'silk', 'linen', 'bamboo', 'microfiber', 'flannel', 'velvet', 'wool', 'mixed', 'other'],
            'description' => 'Primary fabric.',
        ],
        'mood' => [
            'type'        => 'string',
            'enum'        => ['soft', 'fresh', 'cozy', 'romantic', 'energetic', 'calm', 'luxurious', 'playful'],
            'description' => 'Emotional mood the product evokes.',
        ],
        'size_class' => [
            'type'        => 'string',
            'enum'        => ['single', 'one_and_a_half', 'double', 'queen', 'king', 'family', 'euro', 'standard', 'na'],
            'description' => 'Standard bedding size class. "na" if not applicable (e.g. cushion).',
        ],
        'role' => [
            'type'        => 'string',
            'enum'        => ['hero', 'accent', 'accessory'],
            'description' => 'Hero = bedding set / duvet cover / bedspread; Accent = matching pillowcase or throw; Accessory = cushion, decorative pillow, small textile item.',
        ],
        'use_cases' => [
            'type'        => 'array',
            'enum'        => ['everyday', 'gift', 'wedding', 'kids', 'guest_room', 'seasonal_winter', 'seasonal_summer', 'travel'],
            'description' => 'One to three intended use cases.',
            'min'         => 1,
            'max'         => 3,
        ],
        'complements' => [
            'type'        => 'array',
            'description' => 'primary_type values that pair well with this product to "complete the look". 1–6 items.',
            'enum'        => [
                'bedding_set', 'duvet_cover', 'pillowcase', 'pillow', 'duvet_insert',
                'throw_blanket', 'bedspread', 'cushion', 'cushion_cover',
                'mattress_topper', 'bathrobe', 'towel', 'bath_set', 'curtain', 'home_decor',
            ],
            'min' => 1,
            'max' => 6,
        ],
    ],
];
