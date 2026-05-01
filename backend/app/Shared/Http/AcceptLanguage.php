<?php

declare(strict_types=1);

namespace App\Shared\Http;

/**
 * Parses the Accept-Language HTTP request header.
 *
 * Handles the full RFC 7231 format:
 *   uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7
 */
final class AcceptLanguage
{
    /**
     * Return the primary language subtags in priority order (quality value DESC).
     *
     * "uk-UA,uk;q=0.9,en;q=0.8" → ['uk', 'en']   (region subtags stripped, duplicates removed)
     *
     * @return list<string>
     */
    public static function tags(?string $header): array
    {
        if ($header === null || $header === '') {
            return [];
        }

        $entries = [];

        foreach (explode(',', $header) as $part) {
            $segments = explode(';', trim($part));
            $tag      = strtolower(trim($segments[0]));
            $primary  = explode('-', $tag)[0];

            if ($primary === '') {
                continue;
            }

            $quality = 1.0;
            foreach (array_slice($segments, 1) as $param) {
                $param = trim($param);
                if (str_starts_with($param, 'q=')) {
                    $quality = (float) substr($param, 2);
                }
            }

            $entries[] = ['lang' => $primary, 'q' => $quality];
        }

        // Stable sort DESC by quality
        usort($entries, static fn (array $a, array $b): int => $b['q'] <=> $a['q']);

        $seen = [];
        $tags = [];
        foreach ($entries as $entry) {
            if (! isset($seen[$entry['lang']])) {
                $seen[$entry['lang']] = true;
                $tags[]               = $entry['lang'];
            }
        }

        return $tags;
    }

    /**
     * Return the single highest-priority language tag, or null when header is absent/empty.
     */
    public static function primary(?string $header): ?string
    {
        return self::tags($header)[0] ?? null;
    }
}
