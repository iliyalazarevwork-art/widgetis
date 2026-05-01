<?php

declare(strict_types=1);

namespace App\SmartSearch\DataTransferObjects;

use App\SmartSearch\Enums\SearchLanguage;
use App\SmartSearch\Http\Requests\SearchProductsRequest;
use App\WidgetRuntime\Models\Site;

final readonly class SearchQueryDto
{
    private function __construct(
        public string $query,
        public SearchLanguage $lang,
        public int $limit,
        public ?string $category,
        public string $siteId,
    ) {
    }

    public static function fromRequest(SearchProductsRequest $request, Site $site): self
    {
        return new self(
            query: $request->string('q')->toString(),
            lang: SearchLanguage::fromAcceptLanguage($request->header('Accept-Language')),
            limit: (int) $request->input('limit', 4),
            category: $request->filled('category') ? $request->string('category')->toString() : null,
            siteId: (string) $site->getKey(),
        );
    }

}
