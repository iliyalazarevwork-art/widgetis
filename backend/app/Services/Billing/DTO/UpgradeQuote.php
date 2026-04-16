<?php

declare(strict_types=1);

namespace App\Services\Billing\DTO;

use App\Enums\BillingPeriod;
use Carbon\CarbonImmutable;

/**
 * Result of calculating how much a user owes to upgrade to a higher plan.
 *
 * Credit is the unused remainder of the current subscription's last paid
 * order, prorated by days remaining. It is floored to whole UAH in the
 * client's favour. `amountDue` is what the payment provider must charge.
 */
final readonly class UpgradeQuote
{
    public function __construct(
        public string $fromPlanSlug,
        public string $toPlanSlug,
        public BillingPeriod $toBillingPeriod,
        public int $targetAmount,
        public int $creditApplied,
        public int $amountDue,
        public int $daysRemaining,
        public int $daysTotal,
        public CarbonImmutable $newPeriodEnd,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'from_plan_slug'     => $this->fromPlanSlug,
            'to_plan_slug'       => $this->toPlanSlug,
            'to_billing_period'  => $this->toBillingPeriod->value,
            'target_amount'      => $this->targetAmount,
            'credit_applied'     => $this->creditApplied,
            'amount_due'         => $this->amountDue,
            'days_remaining'     => $this->daysRemaining,
            'days_total'         => $this->daysTotal,
            'new_period_end'     => $this->newPeriodEnd->toIso8601String(),
        ];
    }
}
