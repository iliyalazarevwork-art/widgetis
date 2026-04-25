<?php

declare(strict_types=1);

namespace Tests\Unit\Billing;

use App\Core\Services\Billing\ValueObjects\ProductLabel;
use App\Enums\BillingPeriod;
use Tests\TestCase;

final class ProductLabelTest extends TestCase
{
    public function test_formats_monthly_subscription_label_in_ukrainian(): void
    {
        $label = ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'renewal', 'uk');
        $this->assertSame('Widgetis: Pro — щомісячна підписка (renewal)', $label->text);
    }

    public function test_formats_yearly_subscription_label_in_ukrainian(): void
    {
        $label = ProductLabel::forSubscription('Basic', BillingPeriod::Yearly, 'activation', 'uk');
        $this->assertSame('Widgetis: Basic — річна підписка (activation)', $label->text);
    }

    public function test_formats_monthly_subscription_label_in_english(): void
    {
        $label = ProductLabel::forSubscription('Pro', BillingPeriod::Monthly, 'renewal', 'en');
        $this->assertSame('Widgetis: Pro — monthly subscription (renewal)', $label->text);
    }

    public function test_formats_yearly_subscription_label_in_english(): void
    {
        $label = ProductLabel::forSubscription('Max', BillingPeriod::Yearly, 'new', 'en');
        $this->assertSame('Widgetis: Max — yearly subscription (new)', $label->text);
    }
}
