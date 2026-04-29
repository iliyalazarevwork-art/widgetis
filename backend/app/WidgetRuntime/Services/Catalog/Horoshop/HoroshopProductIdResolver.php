<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Horoshop;

use Illuminate\Http\Client\Factory as HttpFactory;
use Throwable;

final readonly class HoroshopProductIdResolver
{
    /**
     * Matches Horoshop product page DOM:
     *   <... id="j-buy-button-counter-12345" ...>
     *   <... id="j-buy-button-widget-12345"  ...>
     */
    private const ID_REGEX = '/id="j-buy-button-(?:counter|widget)-(\d+)"/';

    private const TIMEOUT_SECONDS = 15;

    public function __construct(private HttpFactory $http)
    {
    }

    /**
     * Fetches the Horoshop product id for a given storefront page,
     * or null if the page exists but the id can't be extracted.
     *
     * @throws HoroshopProductIdFetchException on transport-level failure (timeout, 5xx, etc.)
     */
    public function resolve(string $domain, string $alias): ?string
    {
        $url = sprintf('https://%s/%s/', trim($domain, '/'), trim($alias, '/'));

        try {
            $response = $this->http
                ->timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['User-Agent' => 'WidgetisCrawler/1.0'])
                ->get($url);
        } catch (Throwable $e) {
            throw new HoroshopProductIdFetchException("HTTP error for {$url}: {$e->getMessage()}", 0, $e);
        }

        if (! $response->successful()) {
            throw new HoroshopProductIdFetchException("HTTP {$response->status()} for {$url}");
        }

        if (preg_match(self::ID_REGEX, $response->body(), $m) !== 1) {
            return null;
        }

        return $m[1];
    }
}
