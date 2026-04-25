<?php

declare(strict_types=1);

namespace App\Core\Services\Billing\ValueObjects;

use App\Exceptions\Billing\CurrencyMismatchException;
use App\Exceptions\Billing\InvalidMoneyException;

final readonly class Money
{
    private function __construct(
        public int $minorAmount,
        public Currency $currency,
    ) {
    }

    public static function fromMinor(int $minor, Currency $currency): self
    {
        if ($minor < 0) {
            throw InvalidMoneyException::negativeAmount($minor);
        }

        return new self($minor, $currency);
    }

    public static function fromMajor(int|float $major, Currency $currency): self
    {
        if ($major < 0) {
            throw InvalidMoneyException::negativeAmount((int) $major);
        }

        return new self((int) round($major * $currency->minorUnits()), $currency);
    }

    public static function zero(Currency $currency): self
    {
        return new self(0, $currency);
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw CurrencyMismatchException::between($this->currency, $other->currency);
        }

        return new self($this->minorAmount + $other->minorAmount, $this->currency);
    }

    public function subtract(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw CurrencyMismatchException::between($this->currency, $other->currency);
        }

        $result = $this->minorAmount - $other->minorAmount;

        if ($result < 0) {
            throw InvalidMoneyException::negativeAmount($result);
        }

        return new self($result, $this->currency);
    }

    public function isZero(): bool
    {
        return $this->minorAmount === 0;
    }

    public function equals(Money $other): bool
    {
        return $this->currency === $other->currency
            && $this->minorAmount === $other->minorAmount;
    }

    public function toMajor(): float
    {
        return $this->minorAmount / $this->currency->minorUnits();
    }

    public function __toString(): string
    {
        return number_format($this->toMajor(), 2, '.', '') . ' ' . $this->currency->value;
    }
}
