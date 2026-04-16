<?php

declare(strict_types=1);

namespace App\Mail\Billing;

use App\Mail\AppMailable;
use App\Models\Subscription;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class SubscriptionRenewedMail extends AppMailable
{
    public function __construct(public readonly Subscription $subscription)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Підписку продовжено — Widgetis',
        );
    }

    public function content(): Content
    {
        $plan     = $this->subscription->plan;
        $planName = $plan ? $plan->getTranslation('name', 'uk', false) : '';

        return new Content(
            markdown: 'mail.billing.subscription-renewed',
            with: [
                'userName'      => $this->subscription->user->name ?? 'друже',
                'planName'      => $planName,
                'periodEndDate' => $this->subscription->current_period_end->format('d.m.Y'),
            ],
        );
    }
}
