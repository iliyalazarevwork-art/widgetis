<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | OpenAI models
    |--------------------------------------------------------------------------
    |
    | All AI calls in the cart-recommender pipeline go through OpenAI. We use
    | one cheap chat model with structured outputs for both tagging and
    | composition, and a small embedding model for vector retrieval.
    */
    'models' => [
        'tagger'    => env('RECOMMENDER_MODEL_TAGGER', 'gpt-4o-mini'),
        'composer'  => env('RECOMMENDER_MODEL_COMPOSER', 'gpt-4o-mini'),
        'embedding' => env('RECOMMENDER_MODEL_EMBEDDING', 'text-embedding-3-small'),
    ],

    'embedding' => [
        'dimensions' => 1536,
        'batch_size' => 100,
    ],

    'tagging' => [
        'batch_size' => 20,
        'max_retries' => 3,
    ],

    'composer' => [
        'candidate_pool_size' => 50,
        'top_n'               => 4,
        'price_min_ratio'     => 0.3,
        'price_max_ratio'     => 1.5,
    ],

    'cache' => [
        'relations_ttl_seconds' => 7 * 24 * 60 * 60, // 7 days
        'cartum_ttl_seconds'    => 5 * 60,           // 5 min
    ],

    /*
    |--------------------------------------------------------------------------
    | Cartum live-data integration
    |--------------------------------------------------------------------------
    */
    'cartum' => [
        'timeout_seconds' => 2,
        'retries'         => 1,
    ],

];
