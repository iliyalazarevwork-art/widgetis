<?php

declare(strict_types=1);

namespace App\SmartSearch\Services\Search;

use App\SmartSearch\DataTransferObjects\CategoryGroupDto;
use App\SmartSearch\DataTransferObjects\ProductHitDto;
use App\SmartSearch\DataTransferObjects\SearchQueryDto;
use App\SmartSearch\DataTransferObjects\SearchResponseDto;
use App\SmartSearch\Exceptions\InvalidSearchQueryException;
use Illuminate\Support\Facades\DB;

final class PgProductSearchEngine implements ProductSearchEngine
{
    private const MIN_QUERY_LENGTH = 2;
    private const MAX_QUERY_LENGTH = 90;
    private const DEFAULT_PER_GROUP = 4;
    private const SUGGESTION_THRESHOLD = 0.4;

    public function search(SearchQueryDto $query): SearchResponseDto
    {
        $q = mb_strtolower(trim($query->query));

        if (mb_strlen($q) < self::MIN_QUERY_LENGTH) {
            throw InvalidSearchQueryException::tooShort($q);
        }

        if (mb_strlen($q) > self::MAX_QUERY_LENGTH) {
            throw InvalidSearchQueryException::tooLong($q);
        }

        $prefix = $q . '%';
        $siteId = $query->siteId;
        $lang = $query->lang->value;
        $category = $query->category;
        $limit = $query->limit;

        $perGroup = $category !== null ? 9999 : self::DEFAULT_PER_GROUP;
        $hardLimit = $category !== null ? $limit : min($limit * 12, 100);

        $rows = $this->fetchMatched($siteId, $lang, $q, $prefix, $category, $perGroup, $hardLimit);

        // Group results in PHP and extract totals from cat_total window function
        $groupedRows = [];
        $totals = [];
        foreach ($rows as $row) {
            $catName = (string) ($row->category_name ?? 'Other');
            $groupedRows[$catName][] = ProductHitDto::fromRow($row);
            if (! isset($totals[$catName])) {
                $totals[$catName] = (int) ($row->cat_total ?? 0);
            }
        }

        $total = array_sum($totals);

        // Build correction if no results
        $correction = $total === 0 ? $this->fetchSuggestion($siteId, $lang, $q) : null;

        // Build categoryUrls
        $categoryUrls = $this->fetchCategoryUrls($siteId, $lang, array_keys($groupedRows));

        // Build feature flags
        $features = [
            'translit'   => true,
            'typo'       => true,
            'morphology' => true,
            'synonyms'   => false,
            'history'    => true,
        ];

        // Build groups DTO map
        $groups = [];
        foreach ($groupedRows as $catName => $items) {
            $groups[$catName] = CategoryGroupDto::create(
                name: $catName,
                total: $totals[$catName] ?? count($items),
                items: $items,
            );
        }

        return SearchResponseDto::create(
            query: $query->query,
            correction: $correction,
            total: (int) $total,
            accentColor: null,
            currency: 'грн',
            categoryUrls: $categoryUrls,
            features: $features,
            groups: $groups,
        );
    }

    /**
     * Run the main CTE query with per-category totals baked in via window function.
     *
     * @param string|null $category
     * @return list<object>
     */
    private function fetchMatched(
        string $siteId,
        string $lang,
        string $q,
        string $prefix,
        ?string $category,
        int $perGroup,
        int $hardLimit,
    ): array {
        $sql = <<<'SQL'
            WITH tokens AS (
                SELECT plainto_tsquery('simple', :q) AS tq
            ),
            matched AS (
                SELECT
                    p.id,
                    p.external_id,
                    p.name,
                    p.vendor,
                    p.category_id,
                    p.category_name,
                    p.picture,
                    p.url,
                    p.price,
                    p.oldprice,
                    p.currency,
                    p.available,
                    GREATEST(
                        ts_rank(p.tsv, t.tq) * 4.0,
                        similarity(p.search_text, :q2) * 2.0,
                        CASE WHEN p.search_text ILIKE :prefix THEN 1.0 ELSE 0 END
                    ) AS score
                FROM wgt_smart_search_products p, tokens t
                WHERE p.site_id = :site_id
                    AND p.lang = :lang
                    AND (
                        p.tsv @@ t.tq
                        OR p.search_text % :q3
                        OR p.search_text ILIKE :prefix2
                    )
                    AND (:category::text IS NULL OR p.category_name = :category2)
            ),
            ranked AS (
                SELECT
                    *,
                    row_number() OVER (
                        PARTITION BY category_name
                        ORDER BY score DESC, available DESC, price ASC
                    ) AS rn,
                    COUNT(*) OVER (PARTITION BY category_name) AS cat_total
                FROM matched
            )
            SELECT id, external_id, name, vendor, category_id, category_name,
                   picture, url, price, oldprice, currency, available, score, cat_total
            FROM ranked
            WHERE :category3::text IS NOT NULL OR rn <= :per_group
            ORDER BY score DESC
            LIMIT :hard_limit
            SQL;

        /** @var list<object> $rows */
        $rows = DB::connection('pgsql_runtime')->select($sql, [
            'q'          => $q,
            'q2'         => $q,
            'q3'         => $q,
            'prefix'     => $prefix,
            'prefix2'    => $prefix,
            'site_id'    => $siteId,
            'lang'       => $lang,
            'category'   => $category,
            'category2'  => $category,
            'category3'  => $category,
            'per_group'  => $perGroup,
            'hard_limit' => $hardLimit,
        ]);

        return $rows;
    }

    /**
     * Fetch category page URLs for the returned groups.
     *
     * @param list<string> $categoryNames
     * @return array<string, string>
     */
    private function fetchCategoryUrls(string $siteId, string $lang, array $categoryNames): array
    {
        if ($categoryNames === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($categoryNames), '?'));

        $sql = "SELECT name, url FROM wgt_smart_search_categories
                WHERE site_id = ? AND lang = ? AND name IN ({$placeholders})
                  AND url IS NOT NULL";

        $bindings = array_merge([$siteId, $lang], $categoryNames);

        $rows = DB::connection('pgsql_runtime')->select($sql, $bindings);

        $urls = [];
        foreach ($rows as $row) {
            if ($row->url !== null && $row->url !== '') {
                $urls[(string) $row->name] = (string) $row->url;
            }
        }

        return $urls;
    }

    /**
     * Run a fast trigram suggestion query for zero-result queries.
     */
    private function fetchSuggestion(string $siteId, string $lang, string $q): ?string
    {
        $sql = <<<'SQL'
            SELECT word FROM (
                SELECT DISTINCT lower(name) AS word,
                       similarity(lower(name), :q) AS sim
                FROM wgt_smart_search_products
                WHERE site_id = :site_id AND lang = :lang
                ORDER BY sim DESC
                LIMIT 1
            ) sub
            WHERE sim > :threshold
            SQL;

        $rows = DB::connection('pgsql_runtime')->select($sql, [
            'q'         => $q,
            'site_id'   => $siteId,
            'lang'      => $lang,
            'threshold' => self::SUGGESTION_THRESHOLD,
        ]);

        if ($rows === []) {
            return null;
        }

        return (string) $rows[0]->word;
    }
}
