<?php

declare(strict_types=1);

namespace App\Shared\Concerns;

use Spatie\Translatable\HasTranslations as SpatieHasTranslations;

trait HasTranslations
{
    use SpatieHasTranslations;

    public function translated(string $attribute): ?string
    {
        return $this->getTranslation($attribute, app()->getLocale())
            ?: $this->getTranslation($attribute, 'en');
    }

    /**
     * @return array<string, string>
     */
    public function allTranslations(string $attribute): array
    {
        return $this->getTranslations($attribute);
    }
}
