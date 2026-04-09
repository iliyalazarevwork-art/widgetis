<?php

declare(strict_types=1);

namespace App\Services\Billing;

/**
 * Generates order numbers in format: SP YYMM - XXXX
 *
 * - S:    first letter of site domain (A-Z), or '1' if no site
 * - P:    plan letter (F=free, B=basic, P=pro, M=max)
 * - YYMM: 2-digit year + 2-digit month (e.g. 2604 = April 2026)
 * - XXXX: 4 random chars from safe alphabet (no confusable chars)
 *
 * Example: MP2604-K7X2
 */
class OrderNumberGenerator
{
    /**
     * Safe alphabet: excludes visually confusable chars.
     * Removed: 0/O/Q (→ zero), 1/I/L (→ one), B (→8), G (→6), S (→5), Z (→2).
     */
    private const string ALPHABET = 'ACDEFHJKMNPRTUVWXY23456789';

    private const string NO_SITE_CHAR = '1';

    public function generate(?string $site, string $planSlug): string
    {
        $siteChar = $this->extractSiteChar($site);
        $planChar = $this->planChar($planSlug);
        $period = now()->format('ym'); // e.g. 2604

        return $siteChar.$planChar.$period.'-'.$this->randomChars(4);
    }

    private function extractSiteChar(?string $site): string
    {
        if (! $site) {
            return self::NO_SITE_CHAR;
        }

        $domain = (string) preg_replace('/^(https?:\/\/)?(www\.)?/', '', $site);
        $char = strtoupper(substr($domain, 0, 1));

        return ($char && ctype_alpha($char)) ? $char : self::NO_SITE_CHAR;
    }

    private function planChar(string $planSlug): string
    {
        return match (strtolower($planSlug)) {
            'free'  => 'F',
            'basic' => 'B',
            'pro'   => 'P',
            'max'   => 'M',
            default => strtoupper(substr($planSlug, 0, 1)),
        };
    }

    private function randomChars(int $length): string
    {
        $result = '';
        $max = strlen(self::ALPHABET) - 1;

        for ($i = 0; $i < $length; $i++) {
            $result .= self::ALPHABET[random_int(0, $max)];
        }

        return $result;
    }
}
