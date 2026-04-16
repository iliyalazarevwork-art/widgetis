<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Mail\AppMailable;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class SubscriptionUpgradedMail extends AppMailable
{
    public function __construct(
        public readonly Subscription $subscription,
        public readonly ?Plan $oldPlan = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Тариф оновлено — Widgetis',
        );
    }

    public function content(): Content
    {
        $newPlan     = $this->subscription->plan;
        $newPlanName = $newPlan ? $newPlan->getTranslation('name', 'uk', false) : '';
        $oldPlanName = $this->oldPlan ? $this->oldPlan->getTranslation('name', 'uk', false) : '';

        return new Content(
            markdown: 'mail.billing.subscription-upgraded',
            with: [
                'userName'      => $this->subscription->user->name ?? 'друже',
                'oldPlanName'   => $oldPlanName,
                'newPlanName'   => $newPlanName,
                'periodEndDate' => $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}
