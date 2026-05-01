<?php

declare(strict_types=1);

namespace App\SmartSearch\Enums;

use App\Shared\Http\AcceptLanguage;

enum SearchLanguage: string
{
    case Uk = 'uk';
    case Ru = 'ru';
    case En = 'en';
    case Pl = 'pl';

    public static function fromAcceptLanguage(?string $header): self
    {
        foreach (AcceptLanguage::tags($header) as $tag) {
            $resolved = self::tryFrom($tag);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return self::Uk;
    }

    /**
     * Returns the PostgreSQL text-search configuration to use.
     * We use 'simple' for all languages to avoid stemming surprises
     * and because Postgres ships no Ukrainian dictionary.
     */
    public function tsConfig(): string
    {
        return 'simple';
    }
}
