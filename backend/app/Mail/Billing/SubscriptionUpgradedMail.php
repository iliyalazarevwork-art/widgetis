<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionUpgradedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

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
        $newPlanName = $newPlan ? ($newPlan->name['uk'] ?? $newPlan->name['en'] ?? '') : '';
        $oldPlanName = $this->oldPlan ? ($this->oldPlan->name['uk'] ?? $this->oldPlan->name['en'] ?? '') : '';

        return new Content(
            markdown: 'mail.billing.subscription-upgraded',
            with: [
                'userName'    => $this->subscription->user->name ?? 'друже',
                'oldPlanName' => $oldPlanName,
                'newPlanName' => $newPlanName,
                'periodEndDate' => $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}
