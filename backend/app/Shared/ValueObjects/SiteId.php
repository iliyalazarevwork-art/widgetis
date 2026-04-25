<?php

declare(strict_types=1);

namespace App\Shared\ValueObjects;

final readonly class SiteId
{
    public function __construct(public string $value)
    {
        if ($value === '') {
            throw new \InvalidArgumentException('SiteId must not be empty');
        }
    }

    public static function fromString(string $v): self
    {
        return new self($v);
    }

    public function equals(self $o): bool
    {
        return $this->value === $o->value;
    }
}
