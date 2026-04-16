<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Exceptions\Billing\CurrencyMismatchException;
use App\Exceptions\Billing\InvalidMoneyException;
use App\Services\Billing\ValueObjects\Currency;
use App\Services\Billing\ValueObjects\Money;
use Tests\TestCase;

final class MoneyTest extends TestCase
{
    public function test_converts_major_to_minor_correctly(): void
    {
        $money = Money::fromMajor(1.5, Currency::UAH);
        $this->assertSame(150, $money->minorAmount);
    }

    public function test_converts_whole_major_amount_to_minor(): void
    {
        $money = Money::fromMajor(100, Currency::UAH);
        $this->assertSame(10000, $money->minorAmount);
    }

    public function test_rounds_fractional_major_amount_to_nearest_minor(): void
    {
        $money = Money::fromMajor(1.555, Currency::UAH);
        $this->assertSame(156, $money->minorAmount);
    }

    public function test_creates_money_from_minor_units_directly(): void
    {
        $money = Money::fromMinor(150, Currency::UAH);
        $this->assertSame(150, $money->minorAmount);
    }

    public function test_rejects_negative_minor_amount(): void
    {
        $this->expectException(InvalidMoneyException::class);
        Money::fromMinor(-1, Currency::UAH);
    }

    public function test_rejects_negative_major_amount(): void
    {
        $this->expectException(InvalidMoneyException::class);
        Money::fromMajor(-10.0, Currency::UAH);
    }

    public function test_creates_zero_money(): void
    {
        $money = Money::zero(Currency::UAH);
        $this->assertTrue($money->isZero());
        $this->assertSame(0, $money->minorAmount);
    }

    public function test_adds_two_money_values_with_same_currency(): void
    {
        $a = Money::fromMinor(100, Currency::UAH);
        $b = Money::fromMinor(50, Currency::UAH);
        $this->assertSame(150, $a->add($b)->minorAmount);
    }

    public function test_throws_on_add_with_mismatched_currencies(): void
    {
        $this->expectException(CurrencyMismatchException::class);
        $a = Money::fromMinor(100, Currency::UAH);
        $b = Money::fromMinor(100, Currency::USD);
        $a->add($b);
    }

    public function test_subtracts_money_correctly(): void
    {
        $a = Money::fromMinor(200, Currency::UAH);
        $b = Money::fromMinor(80, Currency::UAH);
        $this->assertSame(120, $a->subtract($b)->minorAmount);
    }

    public function test_throws_on_subtract_with_mismatched_currencies(): void
    {
        $this->expectException(CurrencyMismatchException::class);
        $a = Money::fromMinor(100, Currency::UAH);
        $b = Money::fromMinor(50, Currency::USD);
        $a->subtract($b);
    }

    public function test_throws_on_subtract_resulting_in_negative_amount(): void
    {
        $this->expectException(InvalidMoneyException::class);
        $a = Money::fromMinor(50, Currency::UAH);
        $b = Money::fromMinor(100, Currency::UAH);
        $a->subtract($b);
    }

    public function test_checks_equality_between_two_money_values(): void
    {
        $a = Money::fromMinor(100, Currency::UAH);
        $b = Money::fromMinor(100, Currency::UAH);
        $c = Money::fromMinor(200, Currency::UAH);

        $this->assertTrue($a->equals($b));
        $this->assertFalse($a->equals($c));
    }

    public function test_returns_false_for_equals_when_currencies_differ(): void
    {
        $a = Money::fromMinor(100, Currency::UAH);
        $b = Money::fromMinor(100, Currency::USD);
        $this->assertFalse($a->equals($b));
    }

    public function test_converts_minor_back_to_major_float(): void
    {
        $money = Money::fromMinor(150, Currency::UAH);
        $this->assertSame(1.5, $money->toMajor());
    }

    public function test_formats_money_as_string_with_two_decimals_and_currency_code(): void
    {
        $money = Money::fromMinor(150, Currency::UAH);
        $this->assertSame('1.50 UAH', (string) $money);
    }

    public function test_formats_zero_money_correctly(): void
    {
        $this->assertSame('0.00 USD', (string) Money::zero(Currency::USD));
    }
}
