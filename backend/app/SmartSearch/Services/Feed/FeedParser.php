<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Feed;

interface FeedParser
{
    /**
     * Stream-parse a YML/XML feed file and yield records one by one.
     *
     * Each yielded value is an array with:
     *   - 'type': 'category' | 'offer'
     *   - 'data': associative array of fields
     *
     * @return \Generator<int, array{type: 'category'|'offer', data: array<string, mixed>}>
     *
     * @throws \App\SmartSearch\Exceptions\FeedParseException
     */
    public function parse(string $filePath): \Generator;
}
