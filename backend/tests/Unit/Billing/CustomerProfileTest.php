<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Models\User;
use App\Core\Services\Billing\ValueObjects\CustomerProfile;
use Tests\TestCase;

final class CustomerProfileTest extends TestCase
{
    public function test_splits_full_name_into_first_and_last_name(): void
    {
        $user = new User(['name' => 'Ivan Petrov', 'email' => 'ivan@example.com', 'phone' => '+380501234567']);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('Ivan', $profile->firstName);
        $this->assertSame('Petrov', $profile->lastName);
    }

    public function test_uses_first_and_last_token_for_multi_part_names(): void
    {
        $user = new User(['name' => 'Ivan Mykolayovych Petrov', 'email' => 'ivan@example.com', 'phone' => '380501234567']);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('Ivan', $profile->firstName);
        $this->assertSame('Petrov', $profile->lastName);
    }

    public function test_falls_back_widgetis_as_last_name_for_single_word_name(): void
    {
        $user = new User(['name' => 'Ivan', 'email' => 'ivan@example.com', 'phone' => '380501234567']);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('Ivan', $profile->firstName);
        $this->assertSame('Widgetis', $profile->lastName);
    }

    public function test_falls_back_customer_and_widgetis_when_name_is_empty(): void
    {
        $user = new User(['name' => '', 'email' => 'ivan@example.com', 'phone' => '380501234567']);
        $profile = CustomerProfile::fromUser($user, 'en');

        $this->assertSame('Customer', $profile->firstName);
        $this->assertSame('Widgetis', $profile->lastName);
    }

    public function test_strips_non_digit_characters_from_phone(): void
    {
        $user = new User(['name' => 'Test User', 'email' => 't@t.com', 'phone' => '+38 (050) 123-45-67']);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('380501234567', $profile->phone);
    }

    public function test_uses_anonymised_fallback_phone_when_phone_is_null(): void
    {
        $user = new User(['name' => 'Test User', 'email' => 't@t.com', 'phone' => null]);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('380000000000', $profile->phone);
    }

    public function test_uses_anonymised_fallback_phone_when_phone_has_no_digits(): void
    {
        $user = new User(['name' => 'Test User', 'email' => 't@t.com', 'phone' => '---']);
        $profile = CustomerProfile::fromUser($user, 'uk');

        $this->assertSame('380000000000', $profile->phone);
    }

    public function test_stores_locale_and_email_as_provided(): void
    {
        $user = new User(['name' => 'Test User', 'email' => 'test@test.com', 'phone' => '380991234567']);
        $profile = CustomerProfile::fromUser($user, 'en');

        $this->assertSame('test@test.com', $profile->email);
        $this->assertSame('en', $profile->locale);
    }
}
