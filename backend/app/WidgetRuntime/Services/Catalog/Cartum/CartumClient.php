<?php

declare(strict_types=1);

namespace App\WidgetRuntime\Services\Catalog\Cartum;

use App\WidgetRuntime\Models\Site;
use App\WidgetRuntime\Services\Catalog\Cartum\Exceptions\CartumApiException;
use App\WidgetRuntime\Services\Catalog\Cartum\Exceptions\CartumAuthException;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Psr\Log\LoggerInterface;

/**
 * HTTP client for the Cartum e-commerce API.
 *
 * Responsibilities:
 *  - Obtain and cache a per-site bearer token (1 h TTL).
 *  - Batch-export product data by SKU article list.
 *
 * All network errors and non-OK Cartum statuses are converted into typed
 * CartumException subclasses so callers never have to inspect raw responses.
 */
final class CartumClient
{
    private const TOKEN_CACHE_TTL_SECONDS = 3600;

    public function __construct(
        private readonly CacheRepository $cache,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Obtain a Cartum authentication token for the given site.
     *
     * Token is cached for 1 hour under 'cartum:tok:{site_id}'.
     * Throws CartumAuthException when credentials are missing or auth fails.
     */
    public function tokenFor(Site $site): string
    {
        $cacheKey = 'cartum:tok:' . $site->id;

        /** @var string|null $cached */
        $cached = $this->cache->get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        $login    = $site->cartum_login;
        $password = $this->decryptPassword($site);

        if ($login === null || $login === '' || $password === '') {
            throw new CartumAuthException('Site is missing Cartum credentials.');
        }

        $baseUrl  = 'https://' . $site->domain;
        $response = Http::withHeaders([
            'Accept'       => 'application/json; charset=UTF-8',
            'Content-Type' => 'application/json; charset=UTF-8',
        ])
            ->timeout(config('recommender.cartum.timeout_seconds', 2))
            ->post("{$baseUrl}/api/auth/", [
                'login'    => $login,
                'password' => $password,
            ]);

        /** @var array<string, mixed> $body */
        $body   = $response->json() ?? [];
        $status = $body['status'] ?? 'UNKNOWN';

        if ($status !== 'OK') {
            throw new CartumAuthException("Cartum auth failed with status: {$status}");
        }

        $token = $body['response']['token'] ?? null;

        if (!is_string($token) || $token === '') {
            throw new CartumAuthException('Cartum auth returned empty token.');
        }

        $this->cache->put($cacheKey, $token, self::TOKEN_CACHE_TTL_SECONDS);

        return $token;
    }

    /**
     * Export products by SKU (article) list for the given site.
     *
     * Returns an associative array keyed by article (SKU).
     * Returns an empty array when Cartum reports EMPTY status (no matches).
     * Throws CartumApiException on non-OK/non-EMPTY statuses.
     *
     * @param  list<string>             $skus
     * @return array<string, array<string, mixed>>
     */
    public function exportProducts(Site $site, array $skus): array
    {
        if ($skus === []) {
            return [];
        }

        $token   = $this->tokenFor($site);
        $baseUrl = 'https://' . $site->domain;

        $retries = (int) config('recommender.cartum.retries', 1);
        $timeout = (int) config('recommender.cartum.timeout_seconds', 2);

        $response = Http::withHeaders([
            'Accept'       => 'application/json; charset=UTF-8',
            'Content-Type' => 'application/json; charset=UTF-8',
        ])
            ->timeout($timeout)
            ->retry($retries, 200)
            ->post("{$baseUrl}/api/catalog/export/", [
                'token' => $token,
                'expr'  => ['article' => $skus],
                'limit' => count($skus),
            ]);

        /** @var array<string, mixed> $body */
        $body   = $response->json() ?? [];
        $status = $body['status'] ?? 'UNKNOWN';

        if ($status === 'EMPTY') {
            return [];
        }

        if ($status !== 'OK') {
            throw new CartumApiException("Cartum catalog/export failed with status: {$status}");
        }

        /** @var list<array<string, mixed>> $items */
        $items = $body['response']['items'] ?? [];

        $map = [];
        foreach ($items as $item) {
            $article = $item['article'] ?? null;
            if (is_string($article) && $article !== '') {
                $map[$article] = $item;
            }
        }

        return $map;
    }

    // ------------------------------------------------------------------
    // Private helpers
    // ------------------------------------------------------------------

    private function decryptPassword(Site $site): string
    {
        $encrypted = $site->cartum_password_encrypted;

        if ($encrypted === null || $encrypted === '') {
            return '';
        }

        try {
            $decrypted = Crypt::decryptString($encrypted);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            $this->logger->warning('Cartum password decryption failed for site {site_id}', [
                'site_id' => $site->id,
            ]);

            return '';
        }

        return is_string($decrypted) ? $decrypted : '';
    }
}
